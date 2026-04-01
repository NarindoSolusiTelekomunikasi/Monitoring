const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
const API_STYLE = String(import.meta.env.VITE_API_STYLE ?? 'rest').trim().toLowerCase()
const API_PREFIX = String(import.meta.env.VITE_API_PREFIX ?? '/api').trim()
const API_CACHE_BUST = String(import.meta.env.VITE_API_CACHE_BUST ?? '').trim()

function buildUrl(path, params) {
  if (API_STYLE === 'apps-script') {
    const query = new URLSearchParams()
    if (API_CACHE_BUST) {
      query.set('v', API_CACHE_BUST)
    }
    query.set('route', String(path).replace(/^\/+/, ''))
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value == null || value === '' || value === 'all') {
        return
      }
      query.set(key, value)
    })
    return `${API_BASE_URL}?${query.toString()}`
  }

  const normalizedPath = `${API_PREFIX}/${String(path).replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
  const base = API_BASE_URL || ''
  return `${base}${normalizedPath}${toQueryString(params)}`
}

function toQueryString(params) {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value == null || value === '' || value === 'all') {
      return
    }
    query.set(key, value)
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

async function fetchJson(path, params) {
  const response = await fetch(buildUrl(path, params), {
    cache: 'no-store',
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message ?? `Request failed for ${path}`)
  }
  return response.json()
}

export function getDashboard(filters) {
  return fetchJson('/dashboard', filters)
}

export function getHealth() {
  return fetchJson('/health')
}

export function getFilters() {
  return fetchJson('/filters')
}

export function getTickets(filters) {
  return fetchJson('/tickets', filters)
}

export function getTicketDetail(incidentId) {
  return fetchJson(`/tickets/${incidentId}`)
}

export function getTeams(filters) {
  return fetchJson('/teams', filters)
}

export function getImjas(filters) {
  return fetchJson('/imjas', filters)
}

export function getUnspec(filters) {
  return fetchJson('/unspec', filters)
}

export function getJadwal(filters) {
  return fetchJson('/jadwal', filters)
}
