import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/imjas', label: 'IMJAS' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/teams', label: 'Teams' },
  { to: '/unspec', label: 'UNSPEC' },
]

function Sidebar({ mobileOpen, onClose, activeFilters, onResetFilters }) {
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
        <strong>API Live</strong>
        <p>.</p>
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
