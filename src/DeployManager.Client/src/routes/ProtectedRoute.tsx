import { Navigate } from 'react-router-dom'
import { useSyncExternalStore, type ReactNode } from 'react'
import { subscribeToAuth, getAuthSnapshot } from '@/shared/utils/authStore'
import { MainLayout } from '@/shared/layouts/MainLayout'
import type { AuthUser } from '@/shared/types/auth'

function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribeToAuth, () => {
    const user = getAuthSnapshot()
    return !!user
  })
}

function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribeToAuth, () => getAuthSnapshot())
}

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const isAuthenticated = useIsAuthenticated()
  const user = useAuthUser()

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
