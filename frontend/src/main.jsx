import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { DashboardProvider } from './context/DashboardContext'
import './styles.css'

const Router = (import.meta.env.VITE_ROUTER_MODE ?? 'hash') === 'browser' ? BrowserRouter : HashRouter
const rootElement = document.getElementById('root')

function renderFatalError(errorLike) {
  if (!rootElement) {
    return
  }
  const message = String(errorLike?.message ?? errorLike ?? 'Terjadi error tidak terduga.')
  rootElement.innerHTML = `
    <section style="max-width:860px;margin:32px auto;padding:24px;border-radius:18px;border:1px solid rgba(239,68,68,.28);background:rgba(127,29,29,.12);font-family:IBM Plex Sans,Arial,sans-serif;color:#f8fafc">
      <h2 style="margin:0 0 10px 0;font-size:24px">Aplikasi gagal dimuat</h2>
      <p style="margin:0 0 8px 0;line-height:1.5">Coba refresh halaman. Jika masih terjadi, deploy ulang build frontend terbaru.</p>
      <pre style="margin:10px 0 0 0;padding:12px;border-radius:12px;background:rgba(2,6,23,.6);overflow:auto;white-space:pre-wrap">${message}</pre>
    </section>
  `
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Application render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <section className="panel status-panel status-panel--error">
          <h3>Aplikasi gagal dimuat</h3>
          <p>{String(this.state.error?.message ?? this.state.error ?? 'Terjadi error tidak terduga.')}</p>
        </section>
      )
    }
    return this.props.children
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event?.error) {
      renderFatalError(event.error)
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    renderFatalError(event?.reason)
  })
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <Router>
          <DashboardProvider>
            <App />
          </DashboardProvider>
        </Router>
      </AppErrorBoundary>
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Bootstrap error:', error)
  renderFatalError(error)
}
