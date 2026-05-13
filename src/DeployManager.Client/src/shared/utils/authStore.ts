import type { AuthUser } from '@/shared/types/auth'

const AUTH_EVENT = 'auth-state-change'

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('auth_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}

let cached = getStoredUser()
const listeners = new Set<() => void>()

function notify() {
  cached = getStoredUser()
  listeners.forEach((fn) => fn())
}

export function getAuthSnapshot(): AuthUser | null {
  return cached
}

export function subscribeToAuth(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function dispatchAuthEvent(): void {
  notify()
  try {
    window.dispatchEvent(new Event(AUTH_EVENT))
  } catch {
    // ignore
  }
}
