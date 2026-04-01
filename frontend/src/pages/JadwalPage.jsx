import KpiCard from '../components/KpiCard'
import { useDashboard } from '../context/DashboardContext'
import { getJadwal } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function JadwalPage() {
  const { state } = useDashboard()
  const { data, loading, error } = useApiResource(
    () => getJadwal(state.filters),
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
    return <MessageBlock title="Memuat jadwal kehadiran" message="Sedang sinkronisasi jadwal dari spreadsheet..." />
  }

  if (error) {
    return <MessageBlock title="Gagal memuat jadwal kehadiran" message={error} isError />
  }

  const summary = data?.summary ?? {
    totalRows: 0,
    totalTechnicians: 0,
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
  }
  const items = data?.items ?? []

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard label="Total Personil" value={summary.totalTechnicians ?? summary.totalRows} trend="Jumlah teknisi yang tampil pada jadwal." badge="Kehadiran" tone="total" />
        <KpiCard label="Total Hadir" value={summary.totalHadir} trend="Akumulasi hadir dari rekap sheet." badge="On duty" tone="close" />
        <KpiCard label="Izin + Sakit" value={(summary.totalIzin ?? 0) + (summary.totalSakit ?? 0)} trend="Akumulasi izin dan sakit." badge="Perlu monitor" tone="open" />
        <KpiCard label="Total Alpha" value={summary.totalAlpha} trend="Alpha terdeteksi dari rekap jadwal." badge="Follow up" tone="warning" />
      </section>

      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Jadwal Kehadiran</h2>
            <p>Data kehadiran teknisi dari sheet JADWAL KTU SGB.</p>
          </div>
        </div>

        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STO</th>
                  <th>Team</th>
                  <th>Teknisi</th>
                  <th>NIK</th>
                  <th>No HP</th>
                  <th>Periode</th>
                  <th>Hadir</th>
                  <th>Izin</th>
                  <th>Sakit</th>
                  <th>Jadwal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={`${row.sto}-${row.team}-${row.teknisi}-${row.periode}-${index}`}>
                    <td>{row.sto || '-'}</td>
                    <td>{row.team || '-'}</td>
                    <td>{row.teknisi || '-'}</td>
                    <td>{row.nik || '-'}</td>
                    <td>{row.noHp || '-'}</td>
                    <td>{row.periode || '-'}</td>
                    <td>{row.hadir ?? 0}</td>
                    <td>{row.izin ?? 0}</td>
                    <td>{row.sakit ?? 0}</td>
                    <td>{row.jadwal || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state panel">
            <h3>Tidak ada data jadwal</h3>
            <p>Filter aktif saat ini tidak menampilkan data jadwal kehadiran yang cocok.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default JadwalPage
