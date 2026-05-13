import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { authApi } from '@/shared/api/auth'
import type { AuthUser } from '@/shared/types/auth'
import { AuthContext } from '@/providers/AuthContext'
import { subscribeToAuth, dispatchAuthEvent } from '@/shared/utils/authStore'

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('auth_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  useEffect(() => subscribeToAuth(() => setUser(getStoredUser())), [])

  const login = useCallback((token: string, refreshToken: string, username: string, role: string) => {
    const authUser: AuthUser = { token, refreshToken, username, role }
    localStorage.setItem('auth_user', JSON.stringify(authUser))
    setUser(authUser)
    dispatchAuthEvent()
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.revoke()
    } catch {
      // ignore revoke errors
    }
    localStorage.removeItem('auth_user')
    setUser(null)
    dispatchAuthEvent()
  }, [])

  const updateUser = useCallback((authUser: AuthUser) => {
    localStorage.setItem('auth_user', JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
