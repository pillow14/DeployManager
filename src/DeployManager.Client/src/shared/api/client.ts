import axios from 'axios'
import { API_BASE_URL } from '@/shared/constants'
import { authApi } from './auth'
import type { AuthUser } from '@/shared/types/auth'

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

let isRefreshing = false

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('auth_user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    return null
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const user = getStoredUser()
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!axios.isAxiosError(error) || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const user = getStoredUser()
      if (!user?.refreshToken) throw new Error('No refresh token')

      const response = await authApi.refresh({
        token: user.token,
        refreshToken: user.refreshToken,
      })

      const newUser: AuthUser = {
        username: response.username,
        role: response.role,
        token: response.token,
        refreshToken: response.refreshToken,
      }

      localStorage.setItem('auth_user', JSON.stringify(newUser))
      processQueue(null, response.token)

      originalRequest.headers.Authorization = `Bearer ${response.token}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
