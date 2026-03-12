import KpiCard from '../components/KpiCard'
import { useDashboard } from '../context/DashboardContext'
import { getUnspec } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function UnspecPage() {
  const { state } = useDashboard()
  const { data, loading, error } = useApiResource(
    () => getUnspec(state.filters),
    [state.filters.dateRange, state.filters.dateFrom, state.filters.dateTo, state.filters.sto, state.filters.team, state.filters.status, state.filters.serviceType, state.filters.teknisi],
  )

  if (loading && !data) {
    return <MessageBlock title="Memuat UNSPEC" message="Mohon tunggu dan jangan lupa laporan ke kak ari sitera wkwkwkkww." />
  }

  if (error) {
    return <MessageBlock title="Gagal memuat UNSPEC" message={error} isError />
  }

  const summary = data?.summary ?? { totalTeams: 0, totalOpen: 0, totalClose: 0, totalRemaining: 0 }
  const items = data?.items ?? []

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard label="TOTAL Team" value={summary.totalTeams} trend="Jumlah keseluruhan team Narindo Solusi Telekomunikasi" badge="UNSPEC" tone="total" />
        <KpiCard label="Total Open UNSPEC Hari ini" value={summary.totalOpen} trend="Total open UNSPEC" badge="Diperlukan Follow Up Ke Teknisi." tone="open" />
        <KpiCard label="Total Close UNSPEC Hari ini" value={summary.totalClose} trend="Total close UNSPEC" badge="Close" tone="close" />
        <KpiCard label="UNSPEC Yang Masih Open" value={summary.totalRemaining} trend="Total UNSPEC Yang Belum Diselesaikan." badge="Read only" tone="warning" />
      </section>

      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Monitoring UNSPEC</h2>
            <p>Produktivitas teknisi dalam menyelesaikan UNSPEC harian.</p>
          </div>
        </div>

        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STO</th>
                  <th>Team</th>
                  <th>Open UNSPEC</th>
                  <th>Close UNSPEC</th>
                  <th>Sisa UNSPEC</th>
                  <th>Kendala</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={`${row.sto}-${row.team}-${index}`}>
                    <td>{row.sto}</td>
                    <td>{row.team}</td>
                    <td>{row.openUnspec}</td>
                    <td>{row.closeUnspec}</td>
                    <td>{row.sisaUnspec}</td>
                    <td>{row.kendala || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state panel">
            <h3>Tidak ada data UNSPEC</h3>
            <p>Filter aktif saat ini tidak menampilkan row UNSPEC yang cocok.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default UnspecPage
