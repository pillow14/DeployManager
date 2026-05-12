import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts/MainLayout'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SitesPage } from '@/features/deploy-sites/SitesPage'
import { RulesPage } from '@/features/deploy-rules/RulesPage'
import { HistoryPage } from '@/features/deploy-history/HistoryPage'
import { RollbackPage } from '@/features/rollback/RollbackPage'
import { useAuth } from '@/providers/AuthProvider'
import type { ReactNode } from 'react'

const ROLES = {
  ADMIN: 'Administrator',
  PUBLISHER: 'Publisher',
  VIEWER: 'Viewer',
} as const

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function ProtectedLayout({ roles }: { roles?: string[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <MainLayout />
    </ProtectedRoute>
  )
}

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
      { path: 'sites', element: <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PUBLISHER]}><SitesPage /></ProtectedRoute> },
      { path: 'rules', element: <ProtectedRoute roles={[ROLES.ADMIN]}><RulesPage /></ProtectedRoute> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'rollback', element: <ProtectedRoute roles={[ROLES.ADMIN]}><RollbackPage /></ProtectedRoute> },
    ],
  },
])
