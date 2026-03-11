import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { DashboardProvider } from './context/DashboardContext'
import './styles.css'

const Router = (import.meta.env.VITE_ROUTER_MODE ?? 'hash') === 'browser' ? BrowserRouter : HashRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <DashboardProvider>
        <App />
      </DashboardProvider>
    </Router>
  </React.StrictMode>,
)
