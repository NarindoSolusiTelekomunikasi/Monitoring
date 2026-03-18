const CONFIG = {
  spreadsheetId:
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ||
    '1xKFr7vfaEltmSJu6UAodKBqk-fdST8I9vEU-fyC1xLM',
  cacheTtlSeconds: 60,
  filtersCacheTtlSeconds: 300,
  cacheVersion: '2026-03-18-1',
}

const SHEET_CONFIG = {
  DATABASE_RAW: { headerRow: 0 },
  DATABASE_CLEAN: { headerRow: 0 },
  TEAM_MASTER: { headerRow: 0 },
  TEKNISI_NARINDO: { headerRow: 0 },
  TEAM_PERFORMANCE: { headerRow: 0 },
  STO_COMMAND_CENTER: { headerRow: 0 },
  RANKING_TEAM: { headerRow: 0 },
  RANKING_TEKNISI: { headerRow: 0 },
  IMJAS: { headerRow: 1, detectHeader: true },
  UNSPEC: { headerRow: 1, detectHeader: true },
}

const FILTER_DATE_RANGES = {
  today: 0,
  '7d': 7,
  '30d': 30,
}

const STATUS_OPTIONS = ['OPEN', 'CLOSE SYSTEM', 'CLOSE HD', 'CLOSE MYI']
const TICKET_SOURCE_SHEET = 'DATABASE_CLEAN'
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
let RUNTIME_SPREADSHEET_DATA = null
let RUNTIME_FILTER_OPTIONS = null

function doGet(e) {
  try {
    const route = getRoute(e)
    const normalizedRoute = route.toLowerCase()
    const filters = getFilters(e)
    const cacheKey = buildRouteCacheKey(normalizedRoute, filters)
    if (shouldUseRouteCache(normalizedRoute)) {
      const cachedPayload = getCachedJson(cacheKey)
      if (cachedPayload) {
        return jsonOutput(cachedPayload)
      }
    }

    let payload

    switch (normalizedRoute) {
      case 'health':
        payload = Object.assign({ ok: true }, getHealthData())
        break
      case 'filters':
        payload = {
          filters: getFilterOptions(),
        }
        break
      case 'dashboard':
        payload = Object.assign({ filters: getFilterOptions() }, getDashboardData(filters))
        break
      case 'tickets':
        payload = (function () {
          const items = getTicketData(filters)
          return {
            filters: getFilterOptions(),
            total: items.length,
            items: items,
          }
        })()
        break
      case 'teams':
        payload = Object.assign({ filters: getFilterOptions() }, getTeamData(filters))
        break
      case 'rankings/teams':
        payload = {
          filters: getFilterOptions(),
          items: getRankedTeams(filters),
        }
        break
      case 'rankings/technicians':
        payload = {
          filters: getFilterOptions(),
          items: getRankedTechnicians(filters),
        }
        break
      case 'imjas':
        payload = Object.assign({ filters: getFilterOptions() }, getImjasData(filters))
        break
      case 'unspec':
        payload = Object.assign({ filters: getFilterOptions() }, getUnspecData(filters))
        break
      default:
        if (normalizedRoute.indexOf('tickets/') === 0) {
          const incidentId = route.split('/').slice(1).join('/')
          const ticket = getTicketByIncident(incidentId)
          payload = ticket || {
            error: 'not_found',
            message: 'Ticket ' + incidentId + ' was not found.',
          }
        } else {
          payload = {
            error: 'not_found',
            message: 'Route ' + route + ' is not supported.',
          }
        }
        break
    }

    if (shouldUseRouteCache(normalizedRoute)) {
      putCachedJson(cacheKey, payload, getRouteCacheTtl(normalizedRoute))
    }

    return jsonOutput(payload)
  } catch (error) {
    return jsonOutput({
      error: 'internal_error',
      message: error.message,
    })
  }
}

function getRoute(e) {
  const routeParam = normalizeText(e && e.parameter ? e.parameter.route : '')
  const pathInfo = normalizeText(e && e.pathInfo ? e.pathInfo : '')
  const route = routeParam || pathInfo || 'dashboard'
  return route.replace(/^\/+|\/+$/g, '')
}

function getFilters(e) {
  return e && e.parameter ? e.parameter : {}
}

function shouldUseRouteCache(route) {
  return ['filters', 'dashboard', 'teams', 'rankings/teams', 'rankings/technicians', 'imjas', 'unspec'].indexOf(route) >= 0
}

function getRouteCacheTtl(route) {
  return route === 'filters' ? CONFIG.filtersCacheTtlSeconds : CONFIG.cacheTtlSeconds
}

function buildRouteCacheKey(route, filters) {
  const relevantFilters = {}
  Object.keys(filters || {})
    .sort()
    .forEach(function (key) {
      const value = filters[key]
      if (value == null || value === '' || value === 'all') {
        return
      }
      relevantFilters[key] = value
    })
  return 'route:' + CONFIG.cacheVersion + ':' + route + ':' + JSON.stringify(relevantFilters)
}

function getCachedJson(key) {
  const cache = CacheService.getScriptCache()
  const raw = cache.get(key)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

function putCachedJson(key, value, ttlSeconds) {
  try {
    CacheService.getScriptCache().put(key, JSON.stringify(value), ttlSeconds)
  } catch (error) {
    // Ignore cache write failures and continue serving fresh data.
  }
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.spreadsheetId)
}

function getSheetBundle(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    throw new Error('Sheet ' + sheetName + ' was not found in spreadsheet.')
  }
  const range = sheet.getDataRange()
  return {
    displayRows: range.getDisplayValues(),
    rawRows: range.getValues(),
  }
}

function normalizeText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim()
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

function toNullableText(value) {
  const normalized = normalizeText(value)
  return normalized || null
}

function hasPrimaryFields(row, keys) {
  return keys.some(function (key) {
    return normalizeText(row[key])
  })
}

function normalizeStatus(value) {
  const normalized = normalizeText(value).toUpperCase()
  if (!normalized) return ''
  if (normalized.indexOf('CLOSE') !== 0) return normalized
  if (normalized.indexOf('MYI') >= 0) return 'CLOSE MYI'
  if (normalized.indexOf('HD') >= 0) return 'CLOSE HD'
  if (normalized.indexOf('SYSTEM') >= 0 || normalized === 'CLOSE') return 'CLOSE SYSTEM'
  return normalized
}

function isClosedStatus(value) {
  return normalizeStatus(value).indexOf('CLOSE') === 0
}

function parseSheetDate(rawValue, displayValue) {
  if (Object.prototype.toString.call(rawValue) === '[object Date]' && !Number.isNaN(rawValue.getTime())) {
    return rawValue.toISOString()
  }

  const numeric = Number(rawValue)
  if (String(rawValue) !== '' && Number.isFinite(numeric)) {
    return excelSerialToIso(numeric)
  }

  return parseWorkbookDateText(displayValue)
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
    const first = Number(match[1])
    const second = Number(match[2])
    const year = Number(match[3])
    const candidates = []

    if (first > 12 && second <= 12) {
      candidates.push({ day: first, month: second })
    } else if (second > 12 && first <= 12) {
      candidates.push({ day: second, month: first })
    } else {
      candidates.push({ day: first, month: second })
      candidates.push({ day: second, month: first })
    }

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index]
      const parsed = new Date(Date.UTC(year, candidate.month - 1, candidate.day))
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString()
      }
    }
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function getDatabaseRawRows(spreadsheet) {
  const bundle = getSheetBundle(spreadsheet, TICKET_SOURCE_SHEET)
  const rows = []

  for (let rowIndex = 1; rowIndex < bundle.displayRows.length; rowIndex += 1) {
    const displayRow = bundle.displayRows[rowIndex]
    const rawRow = bundle.rawRows[rowIndex]
    const incident = normalizeText(displayRow[0])
    if (!incident || incident === 'INCIDENT') {
      continue
    }

    rows.push({
      incident: incident,
      summary: normalizeText(displayRow[1]),
      serviceType: normalizeText(displayRow[2]),
      sto: normalizeText(displayRow[3]),
      workzone: normalizeText(displayRow[3]),
      contactPhone: normalizeText(displayRow[4]),
      contactName: normalizeText(displayRow[5]),
      customerType: normalizeText(displayRow[6]),
      serviceNo: normalizeText(displayRow[7]),
      deviceName: normalizeText(displayRow[8]),
      helpdesk: normalizeText(displayRow[9]),
      jenisTiket: normalizeText(displayRow[10]),
      status: normalizeStatus(displayRow[11]),
      teknisiRaw: normalizeText(displayRow[12]),
      tanggal: parseSheetDate(rawRow[13], displayRow[13]),
    })
  }

  return rows
}

function mapSheetObjects(spreadsheet, sheetName) {
  const bundle = getSheetBundle(spreadsheet, sheetName)
  const headerRow = getHeaderRowIndex(sheetName, bundle.displayRows)
  const headers = bundle.displayRows[headerRow].map(function (value) {
    return normalizeKey(value)
  })

  return bundle.displayRows
    .slice(headerRow + 1)
    .filter(function (row) {
      return row.some(function (cell) {
        return normalizeText(cell)
      })
    })
    .map(function (row) {
      const item = {}
      headers.forEach(function (header, index) {
        item[header] = row[index] || ''
      })
      return item
    })
}

function getHeaderRowIndex(sheetName, rows) {
  const config = SHEET_CONFIG[sheetName] || { headerRow: 0 }
  if (!config.detectHeader) {
    return config.headerRow || 0
  }

  const expectedHeadersBySheet = {
    IMJAS: ['sto', 'team', 'ixsa_odp', 'ixsa_odc'],
    UNSPEC: ['sto', 'team', 'open_unspec', 'close_unspec', 'sisa_unspec'],
  }

  const expectedHeaders = expectedHeadersBySheet[sheetName] || []
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 8); rowIndex += 1) {
    const normalizedRow = rows[rowIndex].map(function (cell) {
      return normalizeKey(cell)
    })
    const allMatched = expectedHeaders.every(function (header) {
      return normalizedRow.indexOf(header) >= 0
    })
    if (allMatched) {
      return rowIndex
    }
  }

  return config.headerRow || 0
}

function technicianDisplayName(value) {
  return normalizeText(value).split('/')[0].trim()
}

function buildTeamLookup(teamMasterRows) {
  const lookup = new Map()
  teamMasterRows.forEach(function (row) {
    const teamName = normalizeText(row.nama_team)
    const sto = normalizeText(row.sto)
    ;[row.teknisi_1, row.teknisi_2]
      .map(technicianDisplayName)
      .filter(Boolean)
      .forEach(function (name) {
        lookup.set(name.toUpperCase(), {
          team: teamName,
          sto: sto,
        })
      })
  })
  return lookup
}

function countMasterTechnicians(teamMasterRows, filters) {
  return countTechniciansNarindo(
    teamMasterRows.reduce(function (allRows, row) {
      const mappedRows = [row.teknisi_1, row.teknisi_2]
        .map(function (teknisi) {
          return {
            sto: normalizeText(row.sto),
            team: normalizeText(row.nama_team),
            teknisi: technicianDisplayName(teknisi),
          }
        })
        .filter(function (item) {
          return item.teknisi
        })
      return allRows.concat(mappedRows)
    }, []),
    filters,
  )
}

function countTechniciansNarindo(teknisiNarindoRows, filters) {
  const selectedStos = parseFilterValues(filters.sto)
  const selectedTeams = parseFilterValues(filters.team)
  const technicians = new Set()

  teknisiNarindoRows.forEach(function (row) {
    const sto = normalizeText(row.sto)
    const team = normalizeText(row.team)
    const stoMatches = selectedStos.length === 0 || selectedStos.indexOf(sto) >= 0
    const teamMatches = selectedTeams.length === 0 || selectedTeams.indexOf(team) >= 0

    if (!stoMatches || !teamMatches) {
      return
    }

    const teknisi = technicianDisplayName(row.teknisi || row.teknisiRaw)
    if (teknisi) {
      technicians.add(teknisi)
    }
  })

  return technicians.size
}

function loadSpreadsheetData() {
  if (RUNTIME_SPREADSHEET_DATA) {
    return RUNTIME_SPREADSHEET_DATA
  }

  const spreadsheet = getSpreadsheet()
  const teamMaster = mapSheetObjects(spreadsheet, 'TEAM_MASTER')
  const teamLookup = buildTeamLookup(teamMaster)
  const teknisiNarindo = mapSheetObjects(spreadsheet, 'TEKNISI_NARINDO').map(function (row) {
    const technicianName = technicianDisplayName(row.teknisi)
    const teamInfo = teamLookup.get(technicianName.toUpperCase()) || null
    return {
      sto: normalizeText(row.sto),
      teknisiRaw: normalizeText(row.teknisi),
      teknisi: technicianName,
      team: teamInfo ? teamInfo.team : null,
    }
  })
  const rawTickets = getDatabaseRawRows(spreadsheet).map(function (row) {
    const technicianName = technicianDisplayName(row.teknisiRaw)
    const teamInfo = teamLookup.get(technicianName.toUpperCase()) || null
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
      team: teamInfo ? teamInfo.team : null,
      tanggal: row.tanggal,
    }
  })

  const teamPerformance = mapSheetObjects(spreadsheet, 'TEAM_PERFORMANCE').map(function (row) {
    return {
      sto: normalizeText(row.sto),
      team: normalizeText(row.team),
      openReguler: toNumber(row.open_reguler),
      openSqm: toNumber(row.open_sqm),
      closeReguler: toNumber(row.close_reguler),
      closeSqm: toNumber(row.close_sqm),
      totalOpen: toNumber(row.total_open),
      totalClose: toNumber(row.total_close),
    }
  })

  const stoCommandCenter = mapSheetObjects(spreadsheet, 'STO_COMMAND_CENTER').map(function (row) {
    return {
      sto: normalizeText(row.sto),
      team: normalizeText(row.team),
      openReg: toNumber(row.open_reg),
      openSqm: toNumber(row.open_sqm),
      closeReg: toNumber(row.close_reg),
      closeSqm: toNumber(row.close_sqm),
      totalOpen: toNumber(row.total_open),
      totalClose: toNumber(row.total_close),
      productivity: toNumber(row.productivity),
    }
  })

  const rankingTeams = mapSheetObjects(spreadsheet, 'RANKING_TEAM').map(function (row) {
    return {
      rank: toNumber(row.rank),
      team: normalizeText(row.team),
      closeReg: toNumber(row.close_reg),
      closeSqm: toNumber(row.close_sqm),
      totalClose: toNumber(row.total_close),
    }
  })

  const rankingTechnicians = mapSheetObjects(spreadsheet, 'RANKING_TEKNISI').map(function (row) {
    return {
      rank: toNumber(row.rank),
      teknisi: normalizeText(row.teknisi),
      closeReg: toNumber(row.close_reg),
      closeSqm: toNumber(row.close_sqm),
      totalClose: toNumber(row.total_close),
    }
  })

  const imjas = mapSheetObjects(spreadsheet, 'IMJAS')
    .filter(function (row) {
      return hasPrimaryFields(row, ['sto', 'team'])
    })
    .map(function (row) {
      return {
        sto: normalizeText(row.sto),
        team: normalizeText(row.team),
        ixsaOdp: toNumber(row.ixsa_odp),
        ixsaOdc: toNumber(row.ixsa_odc),
        validasiTiang: toNullableText(row.validasi_tiang),
      }
    })

  const unspec = mapSheetObjects(spreadsheet, 'UNSPEC')
    .filter(function (row) {
      return hasPrimaryFields(row, ['sto', 'team'])
    })
    .map(function (row) {
      return {
        sto: normalizeText(row.sto),
        team: normalizeText(row.team),
        openUnspec: toNumber(row.open_unspec),
        closeUnspec: toNumber(row.close_unspec),
        sisaUnspec: toNumber(row.sisa_unspec),
        kendala: toNullableText(row.kendala),
      }
    })

  RUNTIME_SPREADSHEET_DATA = {
    teamMaster: teamMaster,
    teknisiNarindo: teknisiNarindo,
    rawTickets: rawTickets,
    teamPerformance: teamPerformance,
    stoCommandCenter: stoCommandCenter,
    rankingTeams: rankingTeams,
    rankingTechnicians: rankingTechnicians,
    imjas: imjas,
    unspec: unspec,
  }

  return RUNTIME_SPREADSHEET_DATA
}

function matchesDate(ticketDate, filters) {
  if (!ticketDate) return !filters.dateFrom && !filters.dateTo && !filters.dateRange

  const date = new Date(ticketDate)
  if (filters.dateFrom && date < new Date(filters.dateFrom)) return false
  if (filters.dateTo && date > new Date(filters.dateTo)) return false

  if (filters.dateRange && filters.dateRange !== 'all') {
    const days = FILTER_DATE_RANGES[filters.dateRange]
    if (days != null) {
      const diff = getJakartaDayDiff(date)
      if (diff == null || diff < 0) return false
      if (filters.dateRange === 'today') {
        if (diff !== 0) return false
      } else if (diff >= days) {
        return false
      }
    }
  }

  return true
}

function matchesQuery(value, query) {
  return normalizeText(value).toLowerCase().indexOf(normalizeText(query).toLowerCase()) >= 0
}

function toJakartaDayKey(value) {
  const date = Object.prototype.toString.call(value) === '[object Date]' ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10)
}

function getJakartaDayDiff(left, right) {
  const leftKey = toJakartaDayKey(left)
  const rightKey = toJakartaDayKey(right || new Date())
  if (!leftKey || !rightKey) {
    return null
  }
  const leftDate = new Date(leftKey + 'T00:00:00Z')
  const rightDate = new Date(rightKey + 'T00:00:00Z')
  return Math.round((rightDate.getTime() - leftDate.getTime()) / 86400000)
}

function parseFilterValues(value) {
  const normalized = normalizeText(value)
  if (!normalized || normalized === 'all') {
    return []
  }
  return normalized
    .split(',')
    .map(function (item) {
      return normalizeText(item)
    })
    .filter(Boolean)
}

function collectUniqueValues(values) {
  return Array.from(
    new Set(
      values
        .map(function (value) {
          return normalizeText(value)
        })
        .filter(Boolean),
    ),
  ).sort()
}

function countUniqueTeams(items) {
  return new Set(
    items
      .map(function (item) {
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

function filterByCommonFields(items, filters, searchableFields) {
  const query = filters.search || ''
  const selectedStos = parseFilterValues(filters.sto)
  return items.filter(function (item) {
    const stoMatches = selectedStos.length === 0 || selectedStos.indexOf(item.sto) >= 0 || selectedStos.indexOf(item.workzone) >= 0
    const teamMatches = !filters.team || filters.team === 'all' || item.team === filters.team
    const teknisiMatches =
      !filters.teknisi ||
      filters.teknisi === 'all' ||
      !Object.prototype.hasOwnProperty.call(item, 'teknisi') ||
      item.teknisi === filters.teknisi ||
      item.technician === filters.teknisi
    const statusMatches =
      !filters.status || filters.status === 'all' || !Object.prototype.hasOwnProperty.call(item, 'status') || item.status === filters.status
    const serviceMatches =
      !filters.serviceType ||
      filters.serviceType === 'all' ||
      !Object.prototype.hasOwnProperty.call(item, 'jenisTiket') ||
      item.jenisTiket === filters.serviceType
    const queryMatches =
      !query ||
      searchableFields.some(function (field) {
        return matchesQuery(item[field], query)
      })

    return stoMatches && teamMatches && teknisiMatches && statusMatches && serviceMatches && queryMatches
  })
}

function summarizeTickets(tickets) {
  const totalsBySto = new Map()

  tickets.forEach(function (ticket) {
    const current = totalsBySto.get(ticket.sto) || { sto: ticket.sto, open: 0, close: 0, total: 0 }
    current.total += 1
    if (isClosedStatus(ticket.status)) {
      current.close += 1
    } else {
      current.open += 1
    }
    totalsBySto.set(ticket.sto, current)
  })

  const totalTickets = tickets.length
  const closeTickets = tickets.filter(function (ticket) {
    return isClosedStatus(ticket.status)
  }).length
  const openTickets = totalTickets - closeTickets
  const activeTechnicians = new Set(
    tickets
      .map(function (ticket) {
        return ticket.teknisi
      })
      .filter(Boolean),
  ).size

  return {
    kpis: {
      totalTickets: totalTickets,
      openTickets: openTickets,
      closeTickets: closeTickets,
      activeTechnicians: activeTechnicians,
      closeRate: totalTickets ? Math.round((closeTickets / totalTickets) * 100) : 0,
    },
    stoSummary: Array.from(totalsBySto.values()).sort(function (left, right) {
      return left.sto.localeCompare(right.sto)
    }),
  }
}

function summarizeTeams(tickets) {
  const teamMap = new Map()
  const technicianMap = new Map()

  tickets.forEach(function (ticket) {
    if (ticket.teknisi) {
      const tech = technicianMap.get(ticket.teknisi) || {
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
      const team = teamMap.get(ticket.team) || {
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

  const technicians = Array.from(technicianMap.values())
    .map(function (item) {
      return Object.assign({}, item, {
        productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
      })
    })
    .sort(function (left, right) {
      return right.close - left.close || right.productivity - left.productivity
    })

  const teams = Array.from(teamMap.values())
    .map(function (item) {
      return Object.assign({}, item, {
        productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
        topPerformer:
          (technicians.find(function (tech) {
            return tech.team === item.team
          }) || {}).teknisi || null,
      })
    })
    .sort(function (left, right) {
      return right.close - left.close || right.productivity - left.productivity
    })

  return {
    teams: teams,
    technicians: technicians,
  }
}

function buildTechnicianDirectory(teknisiNarindoRows) {
  const directory = new Map()

  teknisiNarindoRows.forEach(function (row) {
    const teknisi = technicianDisplayName(row.teknisi || row.teknisiRaw)
    if (!teknisi) {
      return
    }

    directory.set(teknisi.toUpperCase(), {
      teknisi: teknisi,
      sto: normalizeText(row.sto),
      team: normalizeText(row.team),
    })
  })

  return directory
}

function summarizeAggregatedPerformance(data, filters) {
  const technicianDirectory = buildTechnicianDirectory(data.teknisiNarindo)
  const technicians = filterByCommonFields(
    data.rankingTechnicians.map(function (item) {
      const technicianInfo = technicianDirectory.get(item.teknisi.toUpperCase()) || null
      return Object.assign({}, item, {
        sto: technicianInfo ? technicianInfo.sto : '',
        team: technicianInfo ? technicianInfo.team : '',
        close: item.totalClose,
        total: item.totalClose,
      })
    }),
    filters,
    ['teknisi', 'team', 'sto'],
  ).sort(function (left, right) {
    return right.totalClose - left.totalClose || right.closeSqm - left.closeSqm || left.teknisi.localeCompare(right.teknisi)
  })

  const topTechnicianByTeam = new Map()
  technicians.forEach(function (item) {
    if (!item.team || topTechnicianByTeam.has(item.team)) {
      return
    }
    topTechnicianByTeam.set(item.team, item.teknisi)
  })

  const teamsByKey = new Map()
  const applyTeamWorklog = function (key, payload) {
    const current = teamsByKey.get(key) || {
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

    current.open += payload.open || 0
    current.close += payload.close || 0
    current.total += (payload.open || 0) + (payload.close || 0)
    current.openReguler += payload.openReguler || 0
    current.openSqm += payload.openSqm || 0
    current.closeReguler += payload.closeReguler || 0
    current.closeSqm += payload.closeSqm || 0
    current.openUnspec += payload.openUnspec || 0
    current.closeUnspec += payload.closeUnspec || 0
    current.sisaUnspec += payload.sisaUnspec || 0
    teamsByKey.set(key, current)
  }

  filterByCommonFields(data.teamPerformance, filters, ['sto', 'team']).forEach(function (item) {
    const key = `${item.sto}::${item.team}`
    applyTeamWorklog(key, {
      sto: item.sto,
      team: item.team,
      open: item.totalOpen,
      close: item.totalClose,
      openReguler: item.openReguler,
      openSqm: item.openSqm,
      closeReguler: item.closeReguler,
      closeSqm: item.closeSqm,
    })
  })

  filterByCommonFields(data.unspec, filters, ['sto', 'team', 'kendala']).forEach(function (item) {
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

  const teams = Array.from(teamsByKey.values())
    .map(function (item) {
      return Object.assign({}, item, {
        productivity: item.total ? Math.round((item.close / item.total) * 100) : 0,
        topPerformer: topTechnicianByTeam.get(item.team) || null,
      })
    })
    .sort(function (left, right) {
      return right.close - left.close || right.productivity - left.productivity || left.team.localeCompare(right.team)
    })

  return {
    teams: teams,
    technicians: technicians,
  }
}

function getHealthData() {
  const data = loadSpreadsheetData()
  return {
    workbook: 'google-sheet-live',
    cacheVersion: CONFIG.cacheVersion,
    ticketSourceSheet: TICKET_SOURCE_SHEET,
    source: {
      type: 'google-apps-script',
      spreadsheetId: CONFIG.spreadsheetId,
    },
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

function getFilterOptions() {
  if (RUNTIME_FILTER_OPTIONS) {
    return RUNTIME_FILTER_OPTIONS
  }

  const data = loadSpreadsheetData()
  RUNTIME_FILTER_OPTIONS = {
    dateRanges: [
      { value: 'all', label: 'Semua tanggal' },
      { value: 'today', label: 'Hari ini' },
      { value: '7d', label: '7 hari terakhir' },
      { value: '30d', label: '30 hari terakhir' },
    ],
    stos: collectUniqueValues(
      []
        .concat(
          data.rawTickets.map(function (ticket) {
            return ticket.sto
          }),
        )
        .concat(
          data.teamMaster.map(function (item) {
            return item.sto
          }),
        )
        .concat(
          data.teknisiNarindo.map(function (item) {
            return item.sto
          }),
        )
        .concat(
          data.teamPerformance.map(function (item) {
            return item.sto
          }),
        )
        .concat(
          data.stoCommandCenter.map(function (item) {
            return item.sto
          }),
        )
        .concat(
          data.imjas.map(function (item) {
            return item.sto
          }),
        )
        .concat(
          data.unspec.map(function (item) {
            return item.sto
          }),
        ),
    ),
    teams: collectUniqueValues(
      []
        .concat(
          data.teamMaster.map(function (item) {
            return item.nama_team
          }),
        )
        .concat(
          data.rawTickets.map(function (ticket) {
            return ticket.team
          }),
        )
        .concat(
          data.teknisiNarindo.map(function (item) {
            return item.team
          }),
        )
        .concat(
          data.teamPerformance.map(function (item) {
            return item.team
          }),
        )
        .concat(
          data.stoCommandCenter.map(function (item) {
            return item.team
          }),
        )
        .concat(
          data.rankingTeams.map(function (item) {
            return item.team
          }),
        )
        .concat(
          data.imjas.map(function (item) {
            return item.team
          }),
        )
        .concat(
          data.unspec.map(function (item) {
            return item.team
          }),
        ),
    ),
    teknisis: collectUniqueValues(
      []
        .concat(
          data.rawTickets.map(function (ticket) {
            return ticket.teknisi
          }),
        )
        .concat(
          data.teknisiNarindo.map(function (item) {
            return item.teknisi
          }),
        )
        .concat(
          data.rankingTechnicians.map(function (item) {
            return item.teknisi
          }),
        ),
    ),
    statuses: STATUS_OPTIONS,
    serviceTypes: collectUniqueValues(
      data.rawTickets.map(function (ticket) {
        return ticket.jenisTiket
      }),
    ),
  }

  return RUNTIME_FILTER_OPTIONS
}

function getDashboardData(filters) {
  const data = loadSpreadsheetData()
  const filteredTickets = filterByCommonFields(
    data.rawTickets.filter(function (ticket) {
      return matchesDate(ticket.tanggal, filters)
    }),
    filters,
    ['incident', 'summary', 'contactName', 'teknisi', 'jenisTiket', 'serviceType', 'sto'],
  )
  const summary = summarizeTickets(filteredTickets)
  const aggregatedPerformance = summarizeAggregatedPerformance(data, filters)

  return {
    generatedAt: new Date().toISOString(),
    cacheVersion: CONFIG.cacheVersion,
    kpis: summary.kpis,
    totalMasterTechnicians: countTechniciansNarindo(data.teknisiNarindo, filters),
    stoSummary: summary.stoSummary,
    topTeams: aggregatedPerformance.teams.slice(0, 6),
    topTechnicians: aggregatedPerformance.technicians.slice(0, 6),
  }
}

function getTicketData(filters) {
  const data = loadSpreadsheetData()
  return filterByCommonFields(
    data.rawTickets.filter(function (ticket) {
      return matchesDate(ticket.tanggal, filters)
    }),
    filters,
    ['incident', 'summary', 'contactName', 'teknisi', 'jenisTiket', 'serviceType', 'sto'],
  ).sort(function (left, right) {
    const leftTime = left.tanggal ? new Date(left.tanggal).getTime() : 0
    const rightTime = right.tanggal ? new Date(right.tanggal).getTime() : 0
    return rightTime - leftTime
  })
}

function getTicketByIncident(incidentId) {
  const data = loadSpreadsheetData()
  return (
    data.rawTickets.find(function (ticket) {
      return ticket.incident === incidentId
    }) || null
  )
}

function getTeamData(filters) {
  const data = loadSpreadsheetData()
  const aggregatedPerformance = summarizeAggregatedPerformance(data, filters)
  return {
    teams: aggregatedPerformance.teams,
    technicians: aggregatedPerformance.technicians,
    commandCenter: filterByCommonFields(data.stoCommandCenter, filters, ['sto', 'team']),
    teamPerformance: filterByCommonFields(data.teamPerformance, filters, ['sto', 'team']),
  }
}

function getRankedTeams(filters) {
  const data = loadSpreadsheetData()
  return filterByCommonFields(data.rankingTeams, filters, ['team', 'sto'])
}

function getRankedTechnicians(filters) {
  const data = loadSpreadsheetData()
  return filterByCommonFields(data.rankingTechnicians, filters, ['teknisi'])
}

function summarizeImjas(items) {
  return {
    totalTeams: countUniqueTeams(items),
    totalIxsaOdp: items.reduce(function (sum, item) {
      return sum + item.ixsaOdp
    }, 0),
    totalIxsaOdc: items.reduce(function (sum, item) {
      return sum + item.ixsaOdc
    }, 0),
  }
}

function summarizeUnspec(items) {
  return {
    totalTeams: countUniqueTeams(items),
    totalOpen: items.reduce(function (sum, item) {
      return sum + item.openUnspec
    }, 0),
    totalClose: items.reduce(function (sum, item) {
      return sum + item.closeUnspec
    }, 0),
    totalRemaining: items.reduce(function (sum, item) {
      return sum + item.sisaUnspec
    }, 0),
  }
}

function getImjasData(filters) {
  const data = loadSpreadsheetData()
  const items = filterByCommonFields(data.imjas, filters, ['sto', 'team'])
  return {
    summary: summarizeImjas(items),
    items: items,
  }
}

function getUnspecData(filters) {
  const data = loadSpreadsheetData()
  const items = filterByCommonFields(data.unspec, filters, ['sto', 'team', 'kendala'])
  return {
    summary: summarizeUnspec(items),
    items: items,
  }
}
