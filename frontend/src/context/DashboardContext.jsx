import { createContext, useContext, useReducer } from 'react'

const DashboardContext = createContext(null)

const initialState = {
  filters: {
    dateRange: 'all',
    sto: 'all',
    team: 'all',
    status: 'all',
    serviceType: 'all',
    teknisi: 'all',
  },
  selectedTicketId: null,
  mobileNavOpen: false,
}

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'set-filter':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.key]: action.value,
        },
      }
    case 'reset-filters':
      return {
        ...state,
        filters: initialState.filters,
      }
    case 'open-ticket':
      return {
        ...state,
        selectedTicketId: action.ticketId,
      }
    case 'close-ticket':
      return {
        ...state,
        selectedTicketId: null,
      }
    case 'toggle-mobile-nav':
      return {
        ...state,
        mobileNavOpen: !state.mobileNavOpen,
      }
    case 'close-mobile-nav':
      return {
        ...state,
        mobileNavOpen: false,
      }
    default:
      return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  const value = {
    state,
    setFilter: (key, value) => dispatch({ type: 'set-filter', key, value }),
    resetFilters: () => dispatch({ type: 'reset-filters' }),
    openTicket: (ticketId) => dispatch({ type: 'open-ticket', ticketId }),
    closeTicket: () => dispatch({ type: 'close-ticket' }),
    toggleMobileNav: () => dispatch({ type: 'toggle-mobile-nav' }),
    closeMobileNav: () => dispatch({ type: 'close-mobile-nav' }),
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}
