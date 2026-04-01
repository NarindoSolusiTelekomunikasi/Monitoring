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
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
  }
  const items = data?.items ?? []

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard label="Total Jadwal" value={summary.totalRows} trend="Jumlah baris jadwal yang tampil sesuai filter." badge="Kehadiran" tone="total" />
        <KpiCard label="Hadir" value={summary.totalHadir} trend="Status hadir." badge="On duty" tone="close" />
        <KpiCard label="Izin + Sakit" value={(summary.totalIzin ?? 0) + (summary.totalSakit ?? 0)} trend="Akumulasi izin dan sakit." badge="Perlu monitor" tone="open" />
        <KpiCard label="Alpha" value={summary.totalAlpha} trend="Status alpha pada jadwal kehadiran." badge="Follow up" tone="warning" />
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
                  <th>Hari</th>
                  <th>Tanggal</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={`${row.sto}-${row.team}-${row.teknisi}-${row.tanggal}-${index}`}>
                    <td>{row.sto || '-'}</td>
                    <td>{row.team || '-'}</td>
                    <td>{row.teknisi || '-'}</td>
                    <td>{row.hari || '-'}</td>
                    <td>{row.tanggal || '-'}</td>
                    <td>{row.shift || '-'}</td>
                    <td>{row.statusKehadiran || '-'}</td>
                    <td>{row.keterangan || '-'}</td>
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
