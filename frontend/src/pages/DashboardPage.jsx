import KpiCard from '../components/KpiCard'
import RankingList from '../components/RankingList'
import { useDashboard } from '../context/DashboardContext'
import { getDashboard } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function DashboardPage() {
  const { state } = useDashboard()
  const { data, loading, error } = useApiResource(
    () => getDashboard(state.filters),
    [
      state.filters.dateRange,
      state.filters.dateFrom,
      state.filters.dateTo,
      state.filters.sto,
      state.filters.team,
      state.filters.status,
      state.filters.serviceType,
      state.filters.teknisi,
    ],
  )

  if (loading && !data) {
    return <MessageBlock title="Memuat dashboard" message="Mohon tunggu sebentar." />
  }

  if (error) {
    return <MessageBlock title="Gagal memuat dashboard" message={error} isError />
  }

  const kpis = data?.kpis ?? {
    totalTickets: 0,
    openTickets: 0,
    closeTickets: 0,
    activeTechnicians: 0,
    closeRate: 0,
  }
  const totalMasterTechnicians = data?.totalMasterTechnicians ?? 0
  const stoSummary = data?.stoSummary ?? []
  const topTeams = data?.topTeams ?? []
  const topTechnicians = data?.topTechnicians ?? []
  const topTeam = topTeams[0]
  const topOpenZone = [...stoSummary].sort((a, b) => b.open - a.open)[0]
  const topCloseZone = [...stoSummary].sort((a, b) => b.close - a.close)[0]
  const maxWorkzoneValue = Math.max(1, ...stoSummary.map((zone) => Math.max(zone.open, zone.close)))

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard label="Total Tiket" value={kpis.totalTickets} trend="Total tiket open dan close." badge="Workbook live" tone="total" />
        <KpiCard label="Tiket Open" value={kpis.openTickets} trend="Total open tiket seluruh STO." badge="Perlu pantau" tone="open" />
        <KpiCard label="Tiket Close" value={kpis.closeTickets} trend={`${kpis.closeRate}% close rate`} badge="Selesai" tone="close" />
        <KpiCard label="Total Teknisi Narindo" value={totalMasterTechnicians} trend="Teknisi aktif." badge="Team lapangan" tone="warning" />
      </section>

      <section className="analytics-grid">
        <article className="panel status-card">
          <div className="section-heading">
            <div>
              <h2>Status Tiket</h2>
              <p>Ringkasan open dan close tiket hari ini dan filter global hari ini.</p>
            </div>
            <span className="pill pill--total">Filter</span>
          </div>

          <div className="status-card__body">
            <div className="donut-chart" style={{ '--donut-close': `${kpis.closeRate}%` }}>
              <div className="donut-chart__inner">
                <span className="eyebrow">Close rate</span>
                <strong>{kpis.closeRate}%</strong>
              </div>
            </div>

            <div className="status-card__legend">
              <div className="legend-stat legend-stat--close">
                <span className="legend-label">
                  <span className="legend-dot legend-dot--close" />
                  Close
                </span>
                <strong>{kpis.closeTickets}</strong>
              </div>
              <div className="legend-stat legend-stat--open">
                <span className="legend-label">
                  <span className="legend-dot legend-dot--open" />
                  Open
                </span>
                <strong>{kpis.openTickets}</strong>
              </div>
              <div className="legend-note">
                <span className="eyebrow">Highlight</span>
                <p>{topOpenZone ? `${topOpenZone.sto} menyumbang open tertinggi dengan ${topOpenZone.open} tiket.` : 'Belum ada data STO.'}</p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel workzone-card">
          <div className="section-heading">
            <div>
              <h2>Performansi STO</h2>
              <p>Performansi STO saat ini.</p>
            </div>
            <div className="legend-pills">
              <span className="pill pill--open">Open</span>
              <span className="pill pill--close">Close</span>
            </div>
          </div>

          <div className="bar-chart">
            {stoSummary.map((zone) => (
              <div key={zone.sto} className="bar-chart__item">
                <div className="bar-chart__bars">
                  <span className="bar bar--open" style={{ height: `${(zone.open / maxWorkzoneValue) * 100}%` }} />
                  <span className="bar bar--close" style={{ height: `${(zone.close / maxWorkzoneValue) * 100}%` }} />
                </div>
                <span className="bar-chart__label">{zone.sto}</span>
              </div>
            ))}
          </div>

          <div className="insight-grid">
            <div className="insight-card insight-card--open">
              <span>Open tertinggi</span>
              <strong>{topOpenZone ? `${topOpenZone.sto} • ${topOpenZone.open} tiket` : '-'}</strong>
            </div>
            <div className="insight-card insight-card--close">
              <span>Close tertinggi</span>
              <strong>{topCloseZone ? `${topCloseZone.sto} • ${topCloseZone.close} tiket` : '-'}</strong>
            </div>
            <div className="insight-card insight-card--total">
              <span>WORKZONE</span>
              <strong>{stoSummary.length} STO aktif</strong>
            </div>
          </div>
        </article>

        <article className="panel ranking-card">
          <div className="section-heading">
            <div>
              <h2>Ranking Teknisi</h2>
              <p>Top performansi teknisi berdasarkan akumulasi close tiket reguler dan SQM.</p>
            </div>
          </div>
          <RankingList items={topTechnicians.slice(0, 4)} compact />
        </article>
      </section>

      <section className="split-grid">
        <article className="panel table-panel">
          <div className="section-heading">
            <div>
              <h2>Performansi Team Hari Ini.</h2>
              <p>Top performansi team dari akumulasi tiket reguler, tiket SQM, dan pekerjaan unspec.</p>
            </div>
          </div>

          <div className="team-grid">
            {topTeams.map((team) => (
              <article key={team.team} className="team-card">
                <div className="team-card__header">
                  <div>
                    <span className="eyebrow">Team</span>
                    <h3>{team.team}</h3>
                  </div>
                  <span className="pill pill--total">{team.productivity}%</span>
                </div>
                <div className="team-card__stats">
                  <div>
                    <span>STO</span>
                    <strong>{team.sto || '-'}</strong>
                  </div>
                  <div>
                    <span>Close</span>
                    <strong>{team.close}</strong>
                  </div>
                  <div>
                    <span>Open</span>
                    <strong>{team.open}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{team.total}</strong>
                  </div>
                </div>
                <p>Top performer: {team.topPerformer || '-'}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel spotlight-card">
          <span className="eyebrow">Spotlight team harian.</span>
          <h2>{topTeam ? topTeam.team : 'Belum ada team aktif'}</h2>
          <p>
            {topTeam
              ? `${topTeam.team} memimpin dengan ${topTeam.close} close pekerjaan gabungan dan produktivitas ${topTeam.productivity}%.`
              : 'Gunakan filter yang lebih luas untuk melihat performa team.'}
          </p>
          <div className="spotlight-metrics">
            <div>
              <span>Top performer</span>
              <strong>{topTeam?.topPerformer ?? '-'}</strong>
            </div>
            <div>
              <span>Close volume</span>
              <strong>{topTeam?.close ?? 0}</strong>
            </div>
            <div>
              <span>Open load</span>
              <strong>{topTeam?.open ?? 0}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
