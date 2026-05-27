import apiClient from './client'
import type { DeployJob, DeployJobDetail, DeployJobsQueryParams } from '@/shared/types/deployJob'

export const deployJobsApi = {
  getAll: async (params?: DeployJobsQueryParams): Promise<DeployJob[]> => {
    const response = await apiClient.get<DeployJob[]>('/jobs', { params })
    return response.data
  },
  getById: async (id: string): Promise<DeployJobDetail> => {
    const response = await apiClient.get<DeployJobDetail>(`/jobs/${id}`)
    return response.data
  },
  downloadBackup: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/jobs/${id}/download-backup`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `respaldo-${id}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
