import { appDate, technicians, tickets } from './mockData'

const TODAY = new Date(`${appDate}T23:59:59+07:00`)
const filterLabels = {
  dateRange: {
    today: 'Hari ini',
    '7d': '7 hari terakhir',
    '30d': '30 hari terakhir',
  },
}

function diffDays(isoDate) {
  const time = new Date(isoDate).getTime()
  return Math.floor((TODAY.getTime() - time) / (1000 * 60 * 60 * 24))
}

function matchesDateRange(ticket, dateRange) {
  if (dateRange === 'all') return true
  const days = diffDays(ticket.createdAt)
  if (dateRange === 'today') return days === 0
  if (dateRange === '7d') return days <= 7
  if (dateRange === '30d') return days <= 30
  return true
}

export function getFilterOptions() {
  return {
    dateRanges: [
      { value: 'all', label: 'Semua tanggal' },
      { value: 'today', label: 'Hari ini' },
      { value: '7d', label: '7 hari terakhir' },
      { value: '30d', label: '30 hari terakhir' },
    ],
    workzones: ['all', ...new Set(tickets.map((ticket) => ticket.workzone))],
    statuses: ['all', ...new Set(tickets.map((ticket) => ticket.status))],
    services: ['all', ...new Set(tickets.map((ticket) => ticket.service))],
    technicians: ['all', ...technicians.map((tech) => tech.name)],
  }
}

export function filterTickets(ticketItems, filters) {
  return ticketItems.filter((ticket) => {
    const tech = technicians.find((item) => item.id === ticket.technicianId)
    return (
      matchesDateRange(ticket, filters.dateRange) &&
      (filters.workzone === 'all' || ticket.workzone === filters.workzone) &&
      (filters.status === 'all' || ticket.status === filters.status) &&
      (filters.service === 'all' || ticket.service === filters.service) &&
      (filters.technician === 'all' || tech?.name === filters.technician)
    )
  })
}

export function getDashboardMetrics(filteredTickets) {
  const total = filteredTickets.length
  const closed = filteredTickets.filter((ticket) => ticket.status === 'Close').length
  const open = filteredTickets.filter((ticket) => ticket.status !== 'Close').length
  const activeTechnicians = new Set(filteredTickets.map((ticket) => ticket.technicianId)).size
  return {
    total,
    open,
    closed,
    activeTechnicians,
    closeRate: total ? Math.round((closed / total) * 100) : 0,
  }
}

export function getWorkzoneSummary(filteredTickets) {
  const grouped = new Map()
  filteredTickets.forEach((ticket) => {
    const current = grouped.get(ticket.workzone) ?? { name: ticket.workzone, open: 0, close: 0, total: 0 }
    current.total += 1
    if (ticket.status === 'Close') {
      current.close += 1
    } else {
      current.open += 1
    }
    grouped.set(ticket.workzone, current)
  })
  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function getTechnicianSummary(filteredTickets) {
  const grouped = new Map()
  filteredTickets.forEach((ticket) => {
    const tech = technicians.find((item) => item.id === ticket.technicianId)
    if (!tech) return
    const current = grouped.get(tech.id) ?? {
      id: tech.id,
      name: tech.name,
      team: tech.team,
      workzone: tech.workzone,
      specialty: tech.specialty,
      total: 0,
      open: 0,
      close: 0,
      productivity: 0,
      statusTone: 'close',
      statusLabel: 'Baik',
    }
    current.total += 1
    if (ticket.status === 'Close') {
      current.close += 1
    } else {
      current.open += 1
    }
    grouped.set(tech.id, current)
  })

  return [...grouped.values()]
    .map((item) => {
      const productivity = item.total ? Math.round((item.close / item.total) * 100) : 0
      let statusTone = 'warning'
      let statusLabel = 'Perlu dukungan'
      if (productivity >= 80) {
        statusTone = 'close'
        statusLabel = 'Sangat baik'
      } else if (productivity >= 70) {
        statusTone = 'total'
        statusLabel = 'Baik'
      }
      return { ...item, productivity, statusTone, statusLabel }
    })
    .sort((a, b) => b.close - a.close || b.productivity - a.productivity)
}

export function getTeamSummary(filteredTickets) {
  const technicianSummary = getTechnicianSummary(filteredTickets)
  const grouped = new Map()

  technicianSummary.forEach((tech) => {
    const current = grouped.get(tech.team) ?? {
      name: tech.team,
      technicians: 0,
      total: 0,
      open: 0,
      close: 0,
      productivity: 0,
      topPerformer: tech.name,
      topClose: tech.close,
    }
    current.technicians += 1
    current.total += tech.total
    current.open += tech.open
    current.close += tech.close
    if (tech.close > current.topClose) {
      current.topPerformer = tech.name
      current.topClose = tech.close
    }
    grouped.set(tech.team, current)
  })

  return [...grouped.values()]
    .map((team) => ({
      ...team,
      productivity: team.total ? Math.round((team.close / team.total) * 100) : 0,
    }))
    .sort((a, b) => b.close - a.close)
}

export function getTicketById(ticketId) {
  if (!ticketId) return null
  const ticket = tickets.find((item) => item.id === ticketId)
  if (!ticket) return null
  const technician = technicians.find((item) => item.id === ticket.technicianId)
  return { ...ticket, technician }
}

export function getTicketsWithRelations(filteredTickets) {
  return filteredTickets.map((ticket) => ({
    ...ticket,
    technician: technicians.find((item) => item.id === ticket.technicianId),
  }))
}

export function getActiveFilterSummary(filters) {
  return Object.entries(filters)
    .filter(([, value]) => value !== 'all')
    .map(([key, value]) => ({
      key,
      value: filterLabels[key]?.[value] ?? value,
    }))
}
