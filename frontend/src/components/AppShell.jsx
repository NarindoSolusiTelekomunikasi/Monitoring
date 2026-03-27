import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { getFilters, getHealth } from '../data/api'
import useApiResource from '../hooks/useApiResource'
import FilterBar from './FilterBar'
import NarindoLogo from './NarindoLogo'
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
  dateRanges: [
    { value: 'all', label: 'Semua tanggal' },
    { value: 'today', label: 'Hari ini' },
    { value: 'yesterday', label: 'Kemarin' },
    { value: '7d', label: '7 hari terakhir' },
    { value: '30d', label: '30 hari terakhir' },
  ],
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
  const { data } = useApiResource(() => getFilters(), [], { refreshMs: 300000 })
  const { data: health } = useApiResource(() => getHealth(), [], { refreshMs: 60000 })

  const activeFilters = useMemo(
    () =>
      Object.entries(state.filters)
        .filter(([, value]) => value && value !== 'all')
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
        health={health}
      />

      {state.mobileNavOpen ? <button className="mobile-overlay" onClick={closeMobileNav} aria-label="Tutup sidebar" /> : null}

      <div className="app-content">
        <header className="mobile-topbar">
          <button type="button" className="menu-button" onClick={toggleMobileNav}>
            Menu
          </button>
          <div className="mobile-topbar__brand">
            <NarindoLogo className="mobile-topbar__logo" compact />
          </div>
          <div className="mobile-topbar__copy">
            <span className="eyebrow">Narindo Solusi Telekomunikasi</span>
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
