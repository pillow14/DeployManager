import apiClient from './client'
import type { DeployJob, DeployJobsQueryParams } from '@/shared/types/deployJob'

export const deployJobsApi = {
  getAll: async (params?: DeployJobsQueryParams): Promise<DeployJob[]> => {
    const response = await apiClient.get<DeployJob[]>('/jobs', { params })
    return response.data
  },
}
