import apiClient from './client'
import type { DeploySite, CreateDeploySiteRequest, UpdateDeploySiteRequest } from '@/shared/types/deploySite'

export const deploySitesApi = {
  getAll: async (params?: { environmentId?: string; includeInactive?: boolean }): Promise<DeploySite[]> => {
    const response = await apiClient.get<DeploySite[]>('/sites', { params })
    return response.data
  },
  getById: async (id: string): Promise<DeploySite> => {
    const response = await apiClient.get<DeploySite>(`/sites/${id}`)
    return response.data
  },
  create: async (data: CreateDeploySiteRequest): Promise<string> => {
    const response = await apiClient.post<string>('/sites', data)
    return response.data
  },
  update: async (id: string, data: UpdateDeploySiteRequest): Promise<void> => {
    await apiClient.put(`/sites/${id}`, data)
  },
  delete: async (id: string, hardDelete = false): Promise<void> => {
    await apiClient.delete(`/sites/${id}`, { params: { hardDelete } })
  },
}
