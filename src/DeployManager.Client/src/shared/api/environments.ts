import apiClient from './client'
import type { Environment, CreateEnvironmentRequest, UpdateEnvironmentRequest } from '@/shared/types/environment'

export const environmentsApi = {
  getAll: async (): Promise<Environment[]> => {
    const response = await apiClient.get<Environment[]>('/environments')
    return response.data
  },
  getById: async (id: string): Promise<Environment> => {
    const response = await apiClient.get<Environment>(`/environments/${id}`)
    return response.data
  },
  create: async (data: CreateEnvironmentRequest): Promise<string> => {
    const response = await apiClient.post<string>('/environments', data)
    return response.data
  },
  update: async (id: string, data: UpdateEnvironmentRequest): Promise<void> => {
    await apiClient.put(`/environments/${id}`, data)
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/environments/${id}`)
  },
}
