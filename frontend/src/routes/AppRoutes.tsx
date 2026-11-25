import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PrivateRoute from './PrivateRoute'
import CompanyGate from './CompanyGate'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import CompanyCreatePage from '../pages/CompanyCreatePage'
import DashboardPage from '../pages/DashboardPage'
import EmployeesPage from '../pages/EmployeesPage'
import ContractsPage from '../pages/ContractsPage'
import ContractChatPage from '../pages/ContractChatPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import EventsPage from '../pages/EventsPage'
import FinancePage from '../pages/FinancePage'
import LeaderboardPage from '../pages/LeaderboardPage'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/company/create" element={<CompanyCreatePage />} />
        <Route element={<CompanyGate />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/:id/chat" element={<ContractChatPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
