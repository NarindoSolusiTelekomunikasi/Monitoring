import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { getDashboard } from '../data/api'
import useApiResource from '../hooks/useApiResource'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'

const pageMeta = {
  '/': {
    title: 'Dashboard Monitoring Teknisi',
    description: 'Monitoring produktivitas harian teknisi Narindo Solusi Telekomunikasi.',
  },
  '/tickets': {
    title: 'Manajemen Tiket',
    description: 'Detail tiket, filter tiket dan juga status tiket.',
  },
  '/teams': {
    title: 'Team Rankings',
    description: 'Performansi team berdasarkan tiket yang telah diselesaikan.',
  },
  '/imjas': {
    title: 'IMJAS',
    description: 'Monitoring IMJAS per STO dan team..',
  },
  '/unspec': {
    title: 'UNSPEC',
    description: 'Monitoring UNSPEC per STO dan team',
  },
}

const defaultOptions = {
  dateRanges: [{ value: 'all', label: 'Semua tanggal' }],
  stos: ['all'],
  teams: ['all'],
  teknisis: ['all'],
  statuses: ['all'],
  serviceTypes: ['all'],
}

function AppShell() {
  const location = useLocation()
  const { state, toggleMobileNav, closeMobileNav, resetFilters } = useDashboard()
  const meta = pageMeta[location.pathname] ?? pageMeta['/']
  const { data } = useApiResource(
    () => getDashboard(state.filters),
    [
      state.filters.dateRange,
      state.filters.sto,
      state.filters.team,
      state.filters.status,
      state.filters.serviceType,
      state.filters.teknisi,
    ],
  )

  const activeFilters = useMemo(
    () =>
      Object.entries(state.filters)
        .filter(([, value]) => value !== 'all')
        .map(([key, value]) => ({ key, value })),
    [state.filters],
  )

  const options = data?.filters ?? defaultOptions

  return (
    <div className="app-shell">
      <div className="background-grid" aria-hidden="true" />
      <div className="background-glow background-glow-left" aria-hidden="true" />
      <div className="background-glow background-glow-right" aria-hidden="true" />

      <Sidebar
        mobileOpen={state.mobileNavOpen}
        onClose={closeMobileNav}
        activeFilters={activeFilters}
        onResetFilters={resetFilters}
      />

      {state.mobileNavOpen ? <button className="mobile-overlay" onClick={closeMobileNav} aria-label="Tutup sidebar" /> : null}

      <div className="app-content">
        <header className="mobile-topbar">
          <button type="button" className="menu-button" onClick={toggleMobileNav}>
            Menu
          </button>
          <div>
            <span className="eyebrow">NOC workspace</span>
            <strong>{meta.title}</strong>
          </div>
        </header>

        <FilterBar title={meta.title} description={meta.description} options={options} />

        <main className="page-content" onClick={state.mobileNavOpen ? closeMobileNav : undefined}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
