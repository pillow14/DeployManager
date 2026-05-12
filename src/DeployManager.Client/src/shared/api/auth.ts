import apiClient from './client'
import type { LoginRequest, LoginResponse, RegisterRequest, RefreshTokenRequest } from '@/shared/types/auth'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },
  register: async (data: RegisterRequest): Promise<string> => {
    const response = await apiClient.post<string>('/auth/register', data)
    return response.data
  },
  refresh: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', data)
    return response.data
  },
  revoke: async (): Promise<void> => {
    await apiClient.post('/auth/revoke')
  },
}
