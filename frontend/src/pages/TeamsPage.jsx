import RankingList from '../components/RankingList'
import { useDashboard } from '../context/DashboardContext'
import { getTeams } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function TeamsPage() {
  const { state } = useDashboard()
  const { data, loading, error } = useApiResource(
    () => getTeams(state.filters),
    [
      state.filters.dateRange,
      state.filters.sto,
      state.filters.team,
      state.filters.status,
      state.filters.serviceType,
      state.filters.teknisi,
    ],
  )

  if (loading && !data) {
    return <MessageBlock title="Memuat team performance" message="Mengambil rangkuman team dan teknisi dari backend spreadsheet." />
  }

  if (error) {
    return <MessageBlock title="Gagal memuat team performance" message={error} isError />
  }

  const teams = data?.teams ?? []
  const technicians = data?.technicians ?? []
  const commandCenter = data?.commandCenter ?? []

  return (
    <div className="page-stack">
      <section className="split-grid split-grid--teams">
        <article className="panel table-panel">
          <div className="section-heading">
            <div>
              <h2>Team Rankings</h2>
              <p>Produktivitas Team.</p>
            </div>
          </div>

          <div className="team-grid">
            {teams.length ? (
              teams.map((team) => (
                <article key={team.team} className="team-card">
                  <div className="team-card__header">
                    <div>
                      <span className="eyebrow">Team</span>
                      <h3>{team.team}</h3>
                    </div>
                    <span className="pill pill--close">{team.productivity}%</span>
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
              ))
            ) : (
              <div className="empty-state panel">
                <h3>Belum ada team pada scope filter ini</h3>
                <p>Perluas filter untuk melihat ranking team dan distribusi performa teknisi.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel ranking-card">
          <div className="section-heading">
            <div>
              <h2>Technician Leaderboard</h2>
              <p>Performa teknisi teratas berdasarkan close ticket.</p>
            </div>
          </div>
          <RankingList items={technicians.slice(0, 6)} />
        </article>
      </section>

      <section className="panel table-panel">
        <div className="section-heading section-heading--toolbar">
          <div>
            <h2>STO Command Center</h2>
            <p>Ringkasan produktivitas STO dan team dari sheet command center.</p>
          </div>
          <div className="toolbar">
            <span className="summary-pill">{commandCenter.length} rows</span>
          </div>
        </div>

        {commandCenter.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STO</th>
                  <th>Team</th>
                  <th>Open Reg</th>
                  <th>Open SQM</th>
                  <th>Close Reg</th>
                  <th>Close SQM</th>
                  <th>Total Open</th>
                  <th>Total Close</th>
                  <th>Produktivitas</th>
                </tr>
              </thead>
              <tbody>
                {commandCenter.map((row) => (
                  <tr key={`${row.sto}-${row.team}`}>
                    <td>{row.sto}</td>
                    <td>{row.team}</td>
                    <td>{row.openReg}</td>
                    <td>{row.openSqm}</td>
                    <td>{row.closeReg}</td>
                    <td>{row.closeSqm}</td>
                    <td>{row.totalOpen}</td>
                    <td>{row.totalClose}</td>
                    <td>
                      <span className="pill pill--total">{row.productivity}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state panel">
            <h3>Tidak ada data command center</h3>
            <p>Filter aktif saat ini tidak menampilkan row command center yang cocok.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default TeamsPage
