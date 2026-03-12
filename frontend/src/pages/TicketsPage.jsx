import { useDeferredValue, useMemo, useState } from 'react'
import TicketDetailDrawer from '../components/TicketDetailDrawer'
import TicketsTable from '../components/TicketsTable'
import { useDashboard } from '../context/DashboardContext'
import { getTicketDetail, getTickets } from '../data/api'
import useApiResource from '../hooks/useApiResource'

function MessageBlock({ title, message, isError = false }) {
  return (
    <section className={`panel status-panel ${isError ? 'status-panel--error' : ''}`}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  )
}

function isClosedStatus(status) {
  return String(status ?? '').startsWith('CLOSE')
}

function TicketsPage() {
  const { state, openTicket, closeTicket } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)
  const queryFilters = useMemo(() => ({ ...state.filters, search: deferredSearch }), [state.filters, deferredSearch])
  const ticketsState = useApiResource(
    () => getTickets(queryFilters),
    [
      state.filters.dateRange,
      state.filters.sto,
      state.filters.team,
      state.filters.status,
      state.filters.serviceType,
      state.filters.teknisi,
      deferredSearch,
    ],
  )
  const detailState = useApiResource(
    () => (state.selectedTicketId ? getTicketDetail(state.selectedTicketId) : Promise.resolve(null)),
    [state.selectedTicketId],
  )

  if (ticketsState.loading && !ticketsState.data) {
    return <MessageBlock title="Memuat tiket" message="Tunggu kak eh agak jaoh jerry beli rokok." />
  }

  if (ticketsState.error) {
    return <MessageBlock title="Gagal memuat tiket" message={ticketsState.error} isError />
  }

  const items = ticketsState.data?.items ?? []
  const stoSummary = items.reduce((accumulator, ticket) => {
    const current = accumulator.find((item) => item.sto === ticket.sto)
    if (current) {
      current.total += 1
      if (isClosedStatus(ticket.status)) {
        current.close += 1
      } else {
        current.open += 1
      }
      return accumulator
    }
    accumulator.push({
      sto: ticket.sto,
      total: 1,
      open: isClosedStatus(ticket.status) ? 0 : 1,
      close: isClosedStatus(ticket.status) ? 1 : 0,
    })
    return accumulator
  }, [])

  return (
    <div className="page-stack tickets-layout">
      <section className="panel table-panel">
        <div className="section-heading section-heading--toolbar">
          <div>
            <h2>Ticket Queue</h2>
            <p>Cari tiket, buka detail insiden, dan pantau backlog berdasarkan filter dashboard global.</p>
          </div>
          <div className="toolbar toolbar--stretch">
            <input
              className="search-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari incident, customer, jenis tiket, teknisi"
            />
          </div>
        </div>

        <div className="ticket-summary-row">
          <div className="summary-pill">Hasil tiket: {ticketsState.data?.total ?? 0}</div>
          <div className="summary-pill">Pencarian: {deferredSearch ? 'aktif' : 'semua data'}</div>
          <div className="summary-pill">Drawer detail siap</div>
        </div>

        <TicketsTable tickets={items} onSelectTicket={openTicket} />
      </section>

      <TicketDetailDrawer ticket={detailState.data} onClose={closeTicket} workzoneSummary={stoSummary} />
    </div>
  )
}

export default TicketsPage
