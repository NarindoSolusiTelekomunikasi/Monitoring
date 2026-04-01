import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import ImjasPage from './pages/ImjasPage'
import TeamsPage from './pages/TeamsPage'
import TicketsPage from './pages/TicketsPage'
import UnspecPage from './pages/UnspecPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="imjas" element={<ImjasPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="unspec" element={<UnspecPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
