import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/useAuth'
import { MainLayout } from '@/shared/layouts/MainLayout'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
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
