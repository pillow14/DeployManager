import { createContext } from 'react'
import type { AuthUser } from '@/shared/types/auth'

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, refreshToken: string, username: string, role: string) => void
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
