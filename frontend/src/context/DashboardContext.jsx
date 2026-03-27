import { createContext, useContext, useEffect, useReducer } from 'react'

const DashboardContext = createContext(null)
const THEME_STORAGE_KEY = 'nst-theme'
const VALID_THEMES = new Set(['light', 'dark'])

const defaultFilters = {
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  sto: 'all',
  team: 'all',
  status: 'all',
  serviceType: 'all',
  teknisi: 'all',
}

const initialState = {
  filters: defaultFilters,
  selectedTicketId: null,
  mobileNavOpen: false,
  theme: 'dark',
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (VALID_THEMES.has(storedTheme)) {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function createInitialState() {
  return {
    ...initialState,
    filters: { ...defaultFilters },
    theme: getInitialTheme(),
  }
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
        filters: { ...defaultFilters },
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
    case 'set-theme':
      if (!VALID_THEMES.has(action.theme)) {
        return state
      }
      return {
        ...state,
        theme: action.theme,
      }
    case 'toggle-theme':
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark',
      }
    default:
      return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, undefined, createInitialState)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, state.theme)
    document.body.setAttribute('data-theme', state.theme)
    document.documentElement.style.colorScheme = state.theme
  }, [state.theme])

  const value = {
    state,
    setFilter: (key, value) => dispatch({ type: 'set-filter', key, value }),
    resetFilters: () => dispatch({ type: 'reset-filters' }),
    openTicket: (ticketId) => dispatch({ type: 'open-ticket', ticketId }),
    closeTicket: () => dispatch({ type: 'close-ticket' }),
    toggleMobileNav: () => dispatch({ type: 'toggle-mobile-nav' }),
    closeMobileNav: () => dispatch({ type: 'close-mobile-nav' }),
    setTheme: (theme) => dispatch({ type: 'set-theme', theme }),
    toggleTheme: () => dispatch({ type: 'toggle-theme' }),
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
