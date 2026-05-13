import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EnvironmentsPage } from '@/features/environments/EnvironmentsPage'
import { SitesPage } from '@/features/deploy-sites/SitesPage'
import { RulesPage } from '@/features/deploy-rules/RulesPage'
import { HistoryPage } from '@/features/deploy-history/HistoryPage'
import { RollbackPage } from '@/features/rollback/RollbackPage'
import { ProtectedRoute, ProtectedLayout } from '@/routes/ProtectedRoute'

const ROLES = {
  ADMIN: 'Administrator',
  PUBLISHER: 'Publisher',
  VIEWER: 'Viewer',
} as const

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'environments', element: <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PUBLISHER]}><EnvironmentsPage /></ProtectedRoute> },
      { path: 'sites', element: <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PUBLISHER]}><SitesPage /></ProtectedRoute> },
      { path: 'rules', element: <ProtectedRoute roles={[ROLES.ADMIN]}><RulesPage /></ProtectedRoute> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'rollback', element: <ProtectedRoute roles={[ROLES.ADMIN]}><RollbackPage /></ProtectedRoute> },
    ],
  },
])
