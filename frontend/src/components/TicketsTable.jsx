function getStatusTone(status) {
  if (String(status ?? '').startsWith('CLOSE')) return 'close'
  if (status === 'OPEN') return 'open'
  return 'warning'
}

function TicketsTable({ tickets, onSelectTicket }) {
  if (!tickets.length) {
    return (
      <div className="empty-state panel">
        <h3>Tidak ada tiket yang cocok</h3>
        <p>Ubah kombinasi filter atau kata pencarian untuk melihat tiket lain.</p>
      </div>
    )
  }

  return (
    <>
      <div className="table-wrap desktop-only">
        <table>
          <thead>
            <tr>
              <th>Incident</th>
              <th>Customer</th>
              <th>STO</th>
              <th>Status</th>
              <th>Teknisi</th>
              <th>Tanggal</th>
              <th>Jenis Tiket</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.incident} className="clickable-row" onClick={() => onSelectTicket(ticket.incident)}>
                <td>
                  <strong>{ticket.incident}</strong>
                </td>
                <td>{ticket.contactName || ticket.contactPhone || '-'}</td>
                <td>{ticket.sto || '-'}</td>
                <td>
                  <span className={`pill pill--${getStatusTone(ticket.status)}`}>{ticket.status}</span>
                </td>
                <td>{ticket.teknisi || '-'}</td>
                <td>{ticket.tanggal ? new Date(ticket.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                <td>{ticket.jenisTiket || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards mobile-only">
        {tickets.map((ticket) => (
          <article key={ticket.incident} className="stack-card clickable-row" onClick={() => onSelectTicket(ticket.incident)}>
            <div className="stack-card__header">
              <strong>{ticket.incident}</strong>
              <span className={`pill pill--${getStatusTone(ticket.status)}`}>{ticket.status}</span>
            </div>
            <h3>{ticket.contactName || ticket.contactPhone || 'Pelanggan'}</h3>
            <p>{`${ticket.sto || '-'} | ${ticket.teknisi || '-'} | ${ticket.jenisTiket || '-'}`}</p>
          </article>
        ))}
      </div>
    </>
  )
}

export default TicketsTable
