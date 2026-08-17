import apiClient from './client'
import type { ScheduledDeploy, ScheduledDeployDetail, CreateScheduledDeployRequest, UpdateScheduledDeployRequest } from '@/shared/types/scheduledDeploy'

export const scheduledDeploysApi = {
  getAll: async (): Promise<ScheduledDeploy[]> => {
    const response = await apiClient.get<ScheduledDeploy[]>('/scheduled-deploys')
    return response.data
  },
  getById: async (id: string): Promise<ScheduledDeployDetail> => {
    const response = await apiClient.get<ScheduledDeployDetail>(`/scheduled-deploys/${id}`)
    return response.data
  },
  create: async (request: CreateScheduledDeployRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>('/scheduled-deploys', request)
    return response.data
  },
  update: async (id: string, request: UpdateScheduledDeployRequest): Promise<void> => {
    await apiClient.put(`/scheduled-deploys/${id}`, request)
  },
  cancel: async (id: string): Promise<void> => {
    await apiClient.put(`/scheduled-deploys/${id}/cancel`)
  },
}
