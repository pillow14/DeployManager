import apiClient from './client'
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/shared/types/auth'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },
  register: async (data: RegisterRequest): Promise<string> => {
    const response = await apiClient.post<string>('/auth/register', data)
    return response.data
  },
}
