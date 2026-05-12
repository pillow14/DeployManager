import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts/MainLayout'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SitesPage } from '@/features/deploy-sites/SitesPage'
import { RulesPage } from '@/features/deploy-rules/RulesPage'
import { HistoryPage } from '@/features/deploy-history/HistoryPage'
import { RollbackPage } from '@/features/rollback/RollbackPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
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
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'sites', element: <SitesPage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'rollback', element: <RollbackPage /> },
    ],
  },
])
