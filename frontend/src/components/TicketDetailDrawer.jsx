function getStatusTone(status) {
  if (String(status ?? '').startsWith('CLOSE')) return 'close'
  if (status === 'OPEN') return 'open'
  return 'warning'
}

function TicketDetailDrawer({ ticket, onClose, workzoneSummary = [] }) {
  if (!ticket) return null

  const zone = workzoneSummary.find((item) => item.sto === ticket.sto)
  const tone = getStatusTone(ticket.status)

  return (
    <>
      <button className="drawer-overlay" onClick={onClose} aria-label="Tutup detail tiket" />
      <aside className="ticket-drawer panel">
        <div className="ticket-drawer__header">
          <div>
            <span className="eyebrow">Incident detail</span>
            <h3>{ticket.incident}</h3>
            <p>{ticket.summary || 'Tidak ada ringkasan tambahan pada workbook.'}</p>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className="ticket-drawer__meta">
          <div>
            <span className="eyebrow">Customer</span>
            <strong>{ticket.contactName || '-'}</strong>
          </div>
          <div>
            <span className="eyebrow">Status</span>
            <strong className={`pill pill--${tone}`}>{ticket.status}</strong>
          </div>
          <div>
            <span className="eyebrow">Teknisi</span>
            <strong>{ticket.teknisi || '-'}</strong>
          </div>
          <div>
            <span className="eyebrow">Tanggal</span>
            <strong>{ticket.tanggal ? new Date(ticket.tanggal).toLocaleString('id-ID') : '-'}</strong>
          </div>
        </div>

        <div className="drawer-section">
          <span className="eyebrow">Konteks ticket</span>
          <div className="detail-grid">
            <div className="detail-card">
              <span>STO</span>
              <strong>{ticket.sto || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Team</span>
              <strong>{ticket.team || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Layanan</span>
              <strong>{ticket.serviceType || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Jenis tiket</span>
              <strong>{ticket.jenisTiket || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <span className="eyebrow">Workbook fields</span>
          <div className="detail-grid">
            <div className="detail-card">
              <span>Contact phone</span>
              <strong>{ticket.contactPhone || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Service no</span>
              <strong>{ticket.serviceNo || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Device</span>
              <strong>{ticket.deviceName || '-'}</strong>
            </div>
            <div className="detail-card">
              <span>Customer type</span>
              <strong>{ticket.customerType || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <span className="eyebrow">Summary</span>
          <p>{ticket.summary || 'Tidak ada detail tambahan.'}</p>
          <p>{ticket.helpdesk ? `Helpdesk: ${ticket.helpdesk}` : 'Data berasal langsung dari spreadsheet operasional.'}</p>
        </div>

        {zone ? (
          <div className="drawer-section">
            <span className="eyebrow">Kondisi STO</span>
            <div className="detail-grid">
              <div className="detail-card">
                <span>Total tiket</span>
                <strong>{zone.total}</strong>
              </div>
              <div className="detail-card">
                <span>Open</span>
                <strong>{zone.open}</strong>
              </div>
              <div className="detail-card">
                <span>Close</span>
                <strong>{zone.close}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  )
}

export default TicketDetailDrawer
