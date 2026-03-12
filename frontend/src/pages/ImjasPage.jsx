import KpiCard from '../components/KpiCard'
import { useDashboard } from '../context/DashboardContext'
import { getImjas } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function ImjasPage() {
  const { state } = useDashboard()
  const { data, loading, error } = useApiResource(
    () => getImjas(state.filters),
    [state.filters.dateRange, state.filters.dateFrom, state.filters.dateTo, state.filters.sto, state.filters.team, state.filters.status, state.filters.serviceType, state.filters.teknisi],
  )

  if (loading && !data) {
    return <MessageBlock title="Memuat IMJAS" message="Mohon bersabar ini ujian wkwkkwwk." />
  }

  if (error) {
    return <MessageBlock title="Gagal memuat IMJAS" message={error} isError />
  }

  const summary = data?.summary ?? { totalTeams: 0, totalIxsaOdp: 0, totalIxsaOdc: 0 }
  const items = data?.items ?? []
  const validated = items.filter((item) => item.validasiTiang).length

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard label="Team IMJAS" value={summary.totalTeams} trend="Jumlah keseluruhan team Narindo Solusi Telekomunikasi." badge="IMJAS" tone="total" />
        <KpiCard label="IXSA ODP" value={summary.totalIxsaOdp} trend="Akumulasi progress ODP" badge="Monitoring" tone="open" />
        <KpiCard label="IXSA ODC" value={summary.totalIxsaOdc} trend="Akumulasi progress ODC" badge="Monitoring" tone="close" />
        <KpiCard label="Validasi Tiang" value={validated} trend="Row dengan status validasi tersedia" badge="Read only" tone="warning" />
      </section>

      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Monitoring IMJAS</h2>
            <p>Produktivitas teknisi dalam menyelesaikan IXSA ODP/ODC, dan validasi tiang bulanan.</p>
          </div>
        </div>

        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STO</th>
                  <th>Team</th>
                  <th>IXSA ODP</th>
                  <th>IXSA ODC</th>
                  <th>Validasi Tiang</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={`${row.sto}-${row.team}-${index}`}>
                    <td>{row.sto}</td>
                    <td>{row.team}</td>
                    <td>{row.ixsaOdp}</td>
                    <td>{row.ixsaOdc}</td>
                    <td>{row.validasiTiang || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state panel">
            <h3>Tidak ada data IMJAS</h3>
            <p>Filter aktif saat ini tidak menampilkan row IMJAS yang cocok.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default ImjasPage
