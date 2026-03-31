import 'dotenv/config'
import XLSX from 'xlsx'

const SHEET_CONFIG = {
  DATABASE_RAW: { headerRow: 0 },
  ManualDATABASE: { headerRow: 0 },
  TEAM_MASTER: { headerRow: 0 },
  TEKNISI_NARINDO: { headerRow: 0 },
  TEAM_PERFORMANCE: { headerRow: 0 },
  STO_COMMAND_CENTER: { headerRow: 0 },
  RANKING_TEAM: { headerRow: 0 },
  RANKING_TEKNISI: { headerRow: 0 },
  IMJAS: { headerRow: 1 },
  UNSPEC: { headerRow: 1 },
}

const FILTER_DATE_RANGES = {
  today: 0,
  yesterday: 1,
  '7d': 7,
  '30d': 30,
}

const STATUS_OPTIONS = ['OPEN', 'CLOSE SYSTEM', 'CLOSE HD', 'CLOSE MYI']
const TICKET_SOURCE_SHEET = 'ManualDATABASE'
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

function getGoogleSheetsExportUrl() {
  const explicitUrl = normalizeText(process.env.GOOGLE_SHEETS_EXPORT_URL)
  if (explicitUrl) {
    return explicitUrl
  }
  const spreadsheetId = normalizeText(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is missing. Set it in backend/.env to read from Google Sheets.')
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`
}

function getWorkbookSourceMeta() {
  const spreadsheetId = normalizeText(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  return {
    type: 'google',
    spreadsheetId,
    location: getGoogleSheetsExportUrl(),
  }
}

async function readWorkbook() {
  const exportUrl = getGoogleSheetsExportUrl()
  const response = await fetch(exportUrl)
  if (!response.ok) {
    throw new Error(
      `Google Sheets export failed with ${response.status}. Publish or share the sheet so it can be exported, or provide GOOGLE_SHEETS_EXPORT_URL with accessible access.`,
    )
  }
  const arrayBuffer = await response.arrayBuffer()
  return XLSX.read(Buffer.from(arrayBuffer), {
    type: 'buffer',
    raw: false,
    cellDates: false,
  })
}

function getSheetRows(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error(`Sheet ${sheetName} was not found in workbook.`)
  }
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  })
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function toNumber(value) {
  if (value === '' || value == null) return 0
  const numeric = Number(String(value).replace(/,/g, '.'))
  return Number.isFinite(numeric) ? numeric : 0
}

function readNumberFromRow(row, keys, fallbackValue) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== '' && row[key] != null) {
      return toNumber(row[key])
    }
  }
  return fallbackValue == null ? 0 : fallbackValue
}

function toNullableText(value) {
  const normalized = normalizeText(value)
  return normalized || null
}

function normalizeStatus(value) {
  const normalized = normalizeText(value).toUpperCase()
  if (!normalized) {
    return ''
  }
  if (!normalized.startsWith('CLOSE')) {
    return normalized
  }
  if (normalized.includes('MYI')) {
    return 'CLOSE MYI'
  }
  if (normalized.includes('HD')) {
    return 'CLOSE HD'
  }
  if (normalized.includes('SYSTEM') || normalized === 'CLOSE') {
    return 'CLOSE SYSTEM'
  }
  return normalized
}

function isClosedStatus(value) {
  return normalizeStatus(value).startsWith('CLOSE')
}

function excelSerialToIso(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  const utcDays = Math.floor(numeric - 25569)
  const utcValue = utcDays * 86400
  const dateInfo = new Date(utcValue * 1000)
  const fractionalDay = numeric - Math.floor(numeric) + 0.0000001
  let totalSeconds = Math.floor(86400 * fractionalDay)
  const seconds = totalSeconds % 60
  totalSeconds -= seconds
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  dateInfo.setUTCHours(hours)
  dateInfo.setUTCMinutes(minutes)
  dateInfo.setUTCSeconds(seconds)
  return dateInfo.toISOString()
}

function parseWorkbookDateText(value) {
  const text = normalizeText(value)
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const [, first, second, year] = match
    const left = Number(first)
    const right = Number(second)

    const candidates = []
    if (left > 12 && right <= 12) {
      candidates.push({ day: left, month: right })
    } else if (right > 12 && left <= 12) {
      candidates.push({ day: right, month: left })
    } else {
      candidates.push({ day: left, month: right }, { day: right, month: left })
    }

    for (const candidate of candidates) {
      const parsed = new Date(
        `${year}-${String(candidate.month).padStart(2, '0')}-${String(candidate.day).padStart(2, '0')}T00:00:00+07:00`,
      )
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString()
      }
    }

    return null
  }
  return excelSerialToIso(text)
}

function getCellText(worksheet, ref, { preferRaw = false } = {}) {
  const cell = worksheet[ref]
  if (!cell) {
    return ''
  }
  if (preferRaw && cell.v != null) {
    return String(cell.v)
  }
  if (cell.w != null) {
    return String(cell.w)
  }
  if (cell.v != null) {
    return String(cell.v)
  }
  return ''
}

function getDatabaseRawRows(workbook) {
  const worksheet = workbook.Sheets[TICKET_SOURCE_SHEET]
  if (!worksheet?.['!ref']) {
    throw new Error(`Sheet ${TICKET_SOURCE_SHEET} was not found in workbook.`)
  }
  const range = XLSX.utils.decode_range(worksheet['!ref'])
  const rows = []
  for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex += 1) {
    const incident = normalizeText(getCellText(worksheet, `A${rowIndex + 1}`))
    if (!incident) {
      continue
    }
    rows.push({
      incident,
      summary: normalizeText(getCellText(worksheet, `B${rowIndex + 1}`)),
      serviceType: normalizeText(getCellText(worksheet, `C${rowIndex + 1}`)),
      sto: normalizeText(getCellText(worksheet, `D${rowIndex + 1}`)),
      workzone: normalizeText(getCellText(worksheet, `D${rowIndex + 1}`)),
      contactPhone: normalizeText(getCellText(worksheet, `E${rowIndex + 1}`, { preferRaw: true })),
      contactName: normalizeText(getCellText(worksheet, `F${rowIndex + 1}`)),
      customerType: normalizeText(getCellText(worksheet, `G${rowIndex + 1}`)),
      serviceNo: normalizeText(getCellText(worksheet, `H${rowIndex + 1}`, { preferRaw: true })),
      deviceName: normalizeText(getCellText(worksheet, `I${rowIndex + 1}`)),
      helpdesk: normalizeText(getCellText(worksheet, `J${rowIndex + 1}`)),
      jenisTiket: normalizeText(getCellText(worksheet, `K${rowIndex + 1}`)),
      status: normalizeStatus(getCellText(worksheet, `L${rowIndex + 1}`)),
      teknisiRaw: normalizeText(getCellText(worksheet, `M${rowIndex + 1}`)),
      tanggal: parseWorkbookDateText(getCellText(worksheet, `N${rowIndex + 1}`, { preferRaw: true })),
    })
  }
  return rows
}

function mapSheetObjects(workbook, sheetName) {
  const rows = getSheetRows(workbook, sheetName)
  if (!rows.length) {
    return []
  }
  const headerRow = SHEET_CONFIG[sheetName]?.headerRow ?? 0
  const headers = rows[headerRow].map((value) => normalizeKey(value))
  return rows
    .slice(headerRow + 1)
    .filter((row) => row.some((cell) => normalizeText(cell)))
    .map((row) => {
      const item = {}
      headers.forEach((header, index) => {
        item[header] = row[index] ?? ''
      })
      return item
    })
}

function technicianDisplayName(value) {
  return normalizeText(value).split('/')[0].trim()
}

function buildTeamLookup(teamMasterRows) {
  const lookup = new Map()
  teamMasterRows.forEach((row) => {
    const teamName = normalizeText(row.nama_team)
    const sto = normalizeText(row.sto)
    const teknisi = [row.teknisi_1, row.teknisi_2]
      .map(technicianDisplayName)
      .filter(Boolean)
    teknisi.forEach((name) => {
      lookup.set(name.toUpperCase(), {
        team: teamName,
        sto,
      })
    })
  })
  return lookup
}

function countTechniciansNarindo(teknisiNarindoRows, filters = {}) {
  const selectedStos = parseFilterValues(filters.sto)
  const selectedTeams = parseFilterValues(filters.team)
  const technicians = new Set()

  teknisiNarindoRows.forEach((row) => {
    const sto = normalizeText(row.sto)
    const team = normalizeText(row.team)
    const stoMatches = selectedStos.length === 0 || selectedStos.includes(sto)
    const teamMatches = selectedTeams.length === 0 || selectedTeams.includes(team)

    if (!stoMatches || !teamMatches) {
      return
    }

    const teknisi = technicianDisplayName(row.teknisi ?? row.teknisiRaw)
    if (teknisi) {
      technicians.add(teknisi)
    }
  })

  return technicians.size
}

async function loadWorkbookData() {
  const workbook = await readWorkbook()
  const teamMaster = mapSheetObjects(workbook, 'TEAM_MASTER')
  const teamLookup = buildTeamLookup(teamMaster)
  const teknisiNarindo = mapSheetObjects(workbook, 'TEKNISI_NARINDO').map((row) => {
    const technicianName = technicianDisplayName(row.teknisi)
    const teamInfo = teamLookup.get(technicianName.toUpperCase()) ?? null
    return {
      sto: normalizeText(row.sto),
      teknisiRaw: normalizeText(row.teknisi),
      teknisi: technicianName,
      team: teamInfo?.team ?? null,
    }
  })
  const rawTickets = getDatabaseRawRows(workbook).map((row) => {
    const technicianName = technicianDisplayName(row.teknisiRaw)
    const teamInfo = teamLookup.get(technicianName.toUpperCase()) ?? null
    return {
      incident: row.incident,
      summary: row.summary,
      serviceType: row.serviceType,
      sto: row.sto,
      workzone: row.workzone,
      contactPhone: row.contactPhone,
      contactName: row.contactName,
      customerType: row.customerType,
      serviceNo: row.serviceNo,
      deviceName: row.deviceName,
      helpdesk: row.helpdesk,
      jenisTiket: row.jenisTiket,
      status: row.status,
      teknisi: technicianName,
      teknisiRaw: row.teknisiRaw,
      team: teamInfo?.team ?? null,
      tanggal: row.tanggal,
    }
  })

  const stoCommandCenter = mapSheetObjects(workbook, 'STO_COMMAND_CENTER').map((row) => {
    const openReg = readNumberFromRow(row, ['open_reg', 'openreg'])
    const openSqm = readNumberFromRow(row, ['open_sqm', 'opensqm'])
    const closeReg = readNumberFromRow(row, ['close_reg', 'closereg'])
    const closeSqm = readNumberFromRow(row, ['close_sqm', 'closesqm'])
    const openUnspec = readNumberFromRow(row, ['open_unspec', 'openunspec', 'unspec_open'])
    const closeUnspec = readNumberFromRow(row, ['close_unspec', 'closeunspec', 'unspec_close'])
    const sisaUnspec = readNumberFromRow(row, ['sisa_unspec', 'sisaunspec', 'unspec_remaining'])
    const totalOpen = readNumberFromRow(row, ['total_open', 'opentotal'])
    const totalClose = readNumberFromRow(row, ['total_close', 'closetotal'])

    return {
      sto: normalizeText(row.sto),
      team: normalizeText(row.team),
      openReg,
      openSqm,
      openUnspec,
      closeReg,
      closeSqm,
      closeUnspec,
      sisaUnspec,
      totalOpen,
      totalClose,
      productivity: readNumberFromRow(row, ['productivity', 'produktifitas', 'produktivity', 'produktvitas']),
    }
  })

  const rankingTeams = mapSheetObjects(workbook, 'RANKING_TEAM').map((row) => ({
    rank: toNumber(row.rank),
    team: normalizeText(row.team),
    closeReg: toNumber(row.close_reg),
    closeSqm: toNumber(row.close_sqm),
    totalClose: toNumber(row.total_close),
  }))

  const rankingTechnicians = mapSheetObjects(workbook, 'RANKING_TEKNISI').map((row) => ({
    rank: toNumber(row.rank),
    teknisi: normalizeText(row.teknisi),
    closeReg: toNumber(row.close_reg),
    closeSqm: toNumber(row.close_sqm),
    totalClose: toNumber(row.total_close),
  }))

  const imjas = mapSheetObjects(workbook, 'IMJAS').map((row) => ({
    sto: normalizeText(row.sto),
    team: normalizeText(row.team),
    ixsaOdp: toNumber(row.ixsa_odp),
    ixsaOdc: toNumber(row.ixsa_odc),
    validasiTiang: toNullableText(row.validasi_tiang),
  }))

  const unspec = mapSheetObjects(workbook, 'UNSPEC').map((row) => ({
    sto: normalizeText(row.sto),
    team: normalizeText(row.team),
    openUnspec: toNumber(row.open_unspec),
    closeUnspec: toNumber(row.close_unspec),
    sisaUnspec: toNumber(row.sisa_unspec),
    kendala: toNullableText(row.kendala),
  }))

  return {
    workbook,
    teamMaster,
    teknisiNarindo,
    rawTickets,
    stoCommandCenter,
    rankingTeams,
    rankingTechnicians,
    imjas,
    unspec,
  }
}

function matchesDate(ticketDate, filters) {
  if (!ticketDate) return !filters.dateFrom && !filters.dateTo && !filters.dateRange
  const date = new Date(ticketDate)
  if (filters.dateFrom && new Date(ticketDate) < new Date(filters.dateFrom)) return false
  if (filters.dateTo && new Date(ticketDate) > new Date(filters.dateTo)) return false
  if (filters.dateRange && filters.dateRange !== 'all') {
    const days = FILTER_DATE_RANGES[filters.dateRange]
    if (days != null) {
      const diff = getJakartaDayDiff(date)
      if (diff == null || diff < 0) return false
      if (filters.dateRange === 'today') {
        if (diff !== 0) return false
      } else if (filters.dateRange === 'yesterday') {
        if (diff !== 1) return false
      } else if (diff >= days) {
        return false
      }
    }
  }
  return true
}

function matchesQuery(value, query) {
  return normalizeText(value).toLowerCase().includes(normalizeText(query).toLowerCase())
}

function toJakartaDayKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10)
}

function getJakartaDayDiff(left, right = new Date()) {
  const leftKey = toJakartaDayKey(left)
  const rightKey = toJakartaDayKey(right)
  if (!leftKey || !rightKey) {
    return null
  }
  const leftDate = new Date(`${leftKey}T00:00:00Z`)
  const rightDate = new Date(`${rightKey}T00:00:00Z`)
  return Math.round((rightDate.getTime() - leftDate.getTime()) / 86400000)
}

function parseFilterValues(value) {
  const normalized = normalizeText(value)
  if (!normalized || normalized === 'all') {
    return []
  }
  return normalized
    .split(',')
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function collectUniqueValues(values) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))].sort()
}

function countUniqueTeams(items) {
  return new Set(
    items
      .map((item) => {
        const sto = normalizeText(item.sto)
        const team = normalizeText(item.team)
        if (!sto && !team) {
          return ''
        }
        return `${sto}::${team}`
      })
      .filter(Boolean),
  ).size
}

function filterByCommonFields(items, filters, searchableFields = []) {
  const query = filters.search ?? ''
  const selectedStos = parseFilterValues(filters.sto)
  return items.filter((item) => {
    const stoMatches =
      selectedStos.length === 0 ||
      selectedStos.includes(item.sto) ||
      selectedStos.includes(item.workzone)
    const teamMatches = !filters.team || filters.team === 'all' || item.team === filters.team
    const teknisiMatches =
      !filters.teknisi ||
      filters.teknisi === 'all' ||
      !('teknisi' in item) ||
      item.teknisi === filters.teknisi ||
      item.technician === filters.teknisi
    const statusMatches =
      !filters.status || filters.status === 'all' || !('status' in item) || item.status === filters.status
    const serviceMatches =
      !filters.serviceType ||
      filters.serviceType === 'all' ||
      !('jenisTiket' in item) ||
      item.jenisTiket === filters.serviceType
    const queryMatches =
      !query ||
      searchableFields.some((field) => matchesQuery(item[field], query))
    return stoMatches && teamMatches && teknisiMatches && statusMatches && serviceMatches && queryMatches
  })
}

function summarizeTickets(tickets) {
  const totalsBySto = new Map()
  tickets.forEach((ticket) => {
    const current = totalsBySto.get(ticket.sto) ?? { sto: ticket.sto, open: 0, close: 0, total: 0 }
    current.total += 1
    if (isClosedStatus(ticket.status)) {
      current.close += 1
    } else {
      current.open += 1
    }
    totalsBySto.set(ticket.sto, current)
  })
  const totalTickets = tickets.length
  const closeTickets = tickets.filter((ticket) => isClosedStatus(ticket.status)).length
  const openTickets = totalTickets - closeTickets
  const activeTechnicians = new Set(tickets.map((ticket) => ticket.teknisi).filter(Boolean)).size
  return {
    kpis: {
      totalTickets,
      openTickets,
      closeTickets,
      activeTechnicians,
      closeRate: totalTickets ? Math.round((closeTickets / totalTickets) * 100) : 0,
    },
    stoSummary: [...totalsBySto.values()].sort((a, b) => a.sto.localeCompare(b.sto)),
  }
}

function summarizeTeams(tickets) {
  const teamMap = new Map()
  const technicianMap = new Map()
  tickets.forEach((ticket) => {
    if (ticket.teknisi) {
      const tech = technicianMap.get(ticket.teknisi) ?? {
        teknisi: ticket.teknisi,
        sto: ticket.sto,
        team: ticket.team,
        total: 0,
        open: 0,
        close: 0,
      }
      tech.total += 1
      if (isClosedStatus(ticket.status)) {
        tech.close += 1
      } else {
        tech.open += 1
      }
      technicianMap.set(ticket.teknisi, tech)
    }
    if (ticket.team) {
      const team = teamMap.get(ticket.team) ?? {
        team: ticket.team,
        sto: ticket.sto,
        total: 0,
        open: 0,
        close: 0,
      }
      team.total += 1
      if (isClosedStatus(ticket.status)) {
        team.close += 1
      } else {
        team.open += 1
      }
      teamMap.set(ticket.team, team)
    }
  })

  const technicians = [...technicianMap.values()]
    .map((item) => ({
      ...item,
      productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.close - a.close || b.productivity - a.productivity)

  const teams = [...teamMap.values()]
    .map((item) => ({
      ...item,
      productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
      topPerformer: technicians.find((tech) => tech.team === item.team)?.teknisi ?? null,
    }))
    .sort((a, b) => b.close - a.close || b.productivity - a.productivity)

  return { teams, technicians }
}

function buildTechnicianDirectory(teknisiNarindoRows) {
  const directory = new Map()
  teknisiNarindoRows.forEach((row) => {
    const teknisi = technicianDisplayName(row.teknisi ?? row.teknisiRaw)
    if (!teknisi) {
      return
    }
    directory.set(teknisi.toUpperCase(), {
      teknisi,
      sto: normalizeText(row.sto),
      team: normalizeText(row.team),
    })
  })
  return directory
}

function summarizeAggregatedPerformance(data, filters = {}) {
  const filteredTickets = filterByCommonFields(
    data.rawTickets.filter((ticket) => matchesDate(ticket.tanggal, filters)),
    filters,
    ['incident', 'summary', 'contactName', 'teknisi', 'jenisTiket', 'serviceType', 'sto'],
  )
  const teamsByKey = new Map()
  const techniciansByKey = new Map()

  const applyTeamWorklog = (key, payload) => {
    const current = teamsByKey.get(key) ?? {
      sto: payload.sto,
      team: payload.team,
      open: 0,
      close: 0,
      total: 0,
      openReguler: 0,
      openSqm: 0,
      closeReguler: 0,
      closeSqm: 0,
      openUnspec: 0,
      closeUnspec: 0,
      sisaUnspec: 0,
    }
    current.open += payload.open ?? 0
    current.close += payload.close ?? 0
    current.total += (payload.open ?? 0) + (payload.close ?? 0)
    current.openReguler += payload.openReguler ?? 0
    current.openSqm += payload.openSqm ?? 0
    current.closeReguler += payload.closeReguler ?? 0
    current.closeSqm += payload.closeSqm ?? 0
    current.openUnspec += payload.openUnspec ?? 0
    current.closeUnspec += payload.closeUnspec ?? 0
    current.sisaUnspec += payload.sisaUnspec ?? 0
    teamsByKey.set(key, current)
  }

  filteredTickets.forEach((ticket) => {
    const isClosed = isClosedStatus(ticket.status)
    const isSqm = ticket.jenisTiket === '2. SQM'
    const teamKey = `${ticket.sto}::${ticket.team ?? ''}`
    const technicianKey = `${ticket.sto}::${ticket.team ?? ''}::${ticket.teknisi ?? ''}`

    if (ticket.teknisi) {
      const currentTech = techniciansByKey.get(technicianKey) ?? {
        teknisi: ticket.teknisi,
        sto: ticket.sto,
        team: ticket.team ?? '',
        open: 0,
        close: 0,
        total: 0,
        closeReg: 0,
        closeSqm: 0,
        totalClose: 0,
      }

      currentTech.total += 1
      if (isClosed) {
        currentTech.close += 1
        currentTech.totalClose += 1
        if (isSqm) {
          currentTech.closeSqm += 1
        } else {
          currentTech.closeReg += 1
        }
      } else {
        currentTech.open += 1
      }
      techniciansByKey.set(technicianKey, currentTech)
    }

    if (!ticket.team) {
      return
    }

    applyTeamWorklog(teamKey, {
      sto: ticket.sto,
      team: ticket.team,
      open: isClosed ? 0 : 1,
      close: isClosed ? 1 : 0,
      openReguler: !isClosed && !isSqm ? 1 : 0,
      openSqm: !isClosed && isSqm ? 1 : 0,
      closeReguler: isClosed && !isSqm ? 1 : 0,
      closeSqm: isClosed && isSqm ? 1 : 0,
    })
  })

  const technicians = [...techniciansByKey.values()]
    .map((item) => ({
      ...item,
      productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.close - a.close || b.closeSqm - a.closeSqm || a.teknisi.localeCompare(b.teknisi))

  const topTechnicianByTeam = new Map()
  technicians.forEach((item) => {
    if (!item.team || topTechnicianByTeam.has(item.team)) {
      return
    }
    topTechnicianByTeam.set(item.team, item.teknisi)
  })

  filterByCommonFields(data.unspec, filters, ['sto', 'team', 'kendala']).forEach((item) => {
    const key = `${item.sto}::${item.team}`
    applyTeamWorklog(key, {
      sto: item.sto,
      team: item.team,
      open: item.sisaUnspec,
      close: item.closeUnspec,
      openUnspec: item.openUnspec,
      closeUnspec: item.closeUnspec,
      sisaUnspec: item.sisaUnspec,
    })
  })

  const teams = [...teamsByKey.values()]
    .map((item) => ({
      ...item,
      productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
      topPerformer: topTechnicianByTeam.get(item.team) ?? null,
    }))
    .sort((a, b) => b.close - a.close || b.productivity - a.productivity || a.team.localeCompare(b.team))

  return { teams, technicians }
}

export async function getHealthData() {
  const data = await loadWorkbookData()
  const source = getWorkbookSourceMeta()
  return {
    workbook: 'google-sheet-export',
    ticketSourceSheet: TICKET_SOURCE_SHEET,
    source,
    sheets: Object.keys(SHEET_CONFIG),
    counts: {
      rawTickets: data.rawTickets.length,
      teamMaster: data.teamMaster.length,
      teknisiNarindo: data.teknisiNarindo.length,
      imjas: data.imjas.length,
      unspec: data.unspec.length,
    },
  }
}

export async function getFilterOptions() {
  const data = await loadWorkbookData()
  return {
    dateRanges: [
      { value: 'all', label: 'Semua tanggal' },
      { value: 'today', label: 'Hari ini' },
      { value: 'yesterday', label: 'Kemarin' },
      { value: '7d', label: '7 hari terakhir' },
      { value: '30d', label: '30 hari terakhir' },
    ],
    stos: collectUniqueValues([
      ...data.rawTickets.map((ticket) => ticket.sto),
      ...data.teamMaster.map((item) => item.sto),
      ...data.teknisiNarindo.map((item) => item.sto),
      ...data.stoCommandCenter.map((item) => item.sto),
      ...data.imjas.map((item) => item.sto),
      ...data.unspec.map((item) => item.sto),
    ]),
    teams: collectUniqueValues([
      ...data.teamMaster.map((item) => item.nama_team),
      ...data.rawTickets.map((ticket) => ticket.team),
      ...data.teknisiNarindo.map((item) => item.team),
      ...data.stoCommandCenter.map((item) => item.team),
      ...data.rankingTeams.map((item) => item.team),
      ...data.imjas.map((item) => item.team),
      ...data.unspec.map((item) => item.team),
    ]),
    teknisis: collectUniqueValues([
      ...data.rawTickets.map((ticket) => ticket.teknisi),
      ...data.teknisiNarindo.map((item) => item.teknisi),
      ...data.rankingTechnicians.map((item) => item.teknisi),
    ]),
    statuses: STATUS_OPTIONS,
    serviceTypes: collectUniqueValues(data.rawTickets.map((ticket) => ticket.jenisTiket)),
  }
}

export async function getDashboardData(filters = {}) {
  const data = await loadWorkbookData()
  const filteredTickets = filterByCommonFields(
    data.rawTickets.filter((ticket) => matchesDate(ticket.tanggal, filters)),
    filters,
    ['incident', 'summary', 'contactName', 'teknisi', 'jenisTiket', 'serviceType', 'sto'],
  )
  const summary = summarizeTickets(filteredTickets)
  const aggregatedPerformance = summarizeAggregatedPerformance(data, filters)
  return {
    generatedAt: new Date().toISOString(),
    kpis: summary.kpis,
    totalMasterTechnicians: countTechniciansNarindo(data.teknisiNarindo, filters),
    stoSummary: summary.stoSummary,
    topTeams: aggregatedPerformance.teams.slice(0, 6),
    topTechnicians: aggregatedPerformance.technicians.slice(0, 6),
  }
}

export async function getTicketData(filters = {}) {
  const data = await loadWorkbookData()
  return filterByCommonFields(
    data.rawTickets.filter((ticket) => matchesDate(ticket.tanggal, filters)),
    filters,
    ['incident', 'summary', 'contactName', 'teknisi', 'jenisTiket', 'serviceType', 'sto'],
  ).sort((a, b) => {
    const left = a.tanggal ? new Date(a.tanggal).getTime() : 0
    const right = b.tanggal ? new Date(b.tanggal).getTime() : 0
    return right - left
  })
}

export async function getTicketByIncident(incidentId) {
  const data = await loadWorkbookData()
  return data.rawTickets.find((ticket) => ticket.incident === incidentId) ?? null
}

export async function getTeamData(filters = {}) {
  const data = await loadWorkbookData()
  const aggregatedPerformance = summarizeAggregatedPerformance(data, filters)
  return {
    teams: aggregatedPerformance.teams,
    technicians: aggregatedPerformance.technicians,
    commandCenter: filterByCommonFields(data.stoCommandCenter, filters, ['sto', 'team']),
  }
}

export async function getRankedTeams(filters = {}) {
  const data = await loadWorkbookData()
  return filterByCommonFields(data.rankingTeams, filters, ['team', 'sto'])
}

export async function getRankedTechnicians(filters = {}) {
  const data = await loadWorkbookData()
  return filterByCommonFields(data.rankingTechnicians, filters, ['teknisi'])
}

function summarizeImjas(items) {
  return {
    totalTeams: countUniqueTeams(items),
    totalIxsaOdp: items.reduce((sum, item) => sum + item.ixsaOdp, 0),
    totalIxsaOdc: items.reduce((sum, item) => sum + item.ixsaOdc, 0),
  }
}

function summarizeUnspec(items) {
  return {
    totalTeams: countUniqueTeams(items),
    totalOpen: items.reduce((sum, item) => sum + item.openUnspec, 0),
    totalClose: items.reduce((sum, item) => sum + item.closeUnspec, 0),
    totalRemaining: items.reduce((sum, item) => sum + item.sisaUnspec, 0),
  }
}

export async function getImjasData(filters = {}) {
  const data = await loadWorkbookData()
  const items = filterByCommonFields(data.imjas, filters, ['sto', 'team'])
  return {
    summary: summarizeImjas(items),
    items,
  }
}

export async function getUnspecData(filters = {}) {
  const data = await loadWorkbookData()
  const items = filterByCommonFields(data.unspec, filters, ['sto', 'team', 'kendala'])
  return {
    summary: summarizeUnspec(items),
    items,
  }
}
