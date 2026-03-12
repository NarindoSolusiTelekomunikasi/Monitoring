import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/imjas', label: 'IMJAS' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/teams', label: 'Teams' },
  { to: '/unspec', label: 'UNSPEC' },
]

function formatSpreadsheetId(value) {
  if (!value) {
    return '-'
  }
  if (value.length <= 14) {
    return value
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

function getSourceLabel(source) {
  if (!source?.type) {
    return 'Memuat source...'
  }
  if (source.type === 'google' || source.type === 'google-apps-script') {
    return 'Google Spreadsheet Live'
  }
  return source.type
}

function Sidebar({ mobileOpen, onClose, activeFilters, onResetFilters, health }) {
  const source = health?.source ?? null
  const counts = health?.counts ?? null

  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <span className="chip">NST</span>
        <div>
          <h1>Narindo Solusi Telekomunikasi</h1>
          <p>Dashboard Narindo for ticket monitoring, IMJAS, UNSPEC, and team performansi.</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__panel">
        <span className="eyebrow">Real Time</span>
        <strong>{getSourceLabel(source)}</strong>
        <p>Spreadsheet ID: {formatSpreadsheetId(source?.spreadsheetId)}</p>
        {counts ? (
          <div className="sidebar__stats">
            <span>Tiket {counts.rawTickets ?? 0}</span>
            <span>Teknisi {counts.teknisiNarindo ?? 0}</span>
          </div>
        ) : null}
      </div>

      <div className="sidebar__panel sidebar__panel--filters">
        <div className="sidebar__panel-header">
          <span className="eyebrow">Active filters</span>
          {activeFilters.length ? (
            <button type="button" className="text-button" onClick={onResetFilters}>
              Reset
            </button>
          ) : null}
        </div>
        {activeFilters.length ? (
          <div className="filter-chip-list">
            {activeFilters.map((filter) => (
              <span key={filter.key} className="pill pill--total">
                {filter.value}
              </span>
            ))}
          </div>
        ) : (
          <p>Tidak ada filter aktif. Semua STO, team, tiket, IMJAS, dan UNSPEC sedang ditampilkan.</p>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
