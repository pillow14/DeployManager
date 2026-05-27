import apiClient from './client'
import type { DeployPreview, ConfirmDeployRequest, ConfirmDeployResponse } from '@/shared/types/deploy'

export const deployApi = {
  upload: async (siteId: string, file: File): Promise<DeployPreview> => {
    const formData = new FormData()
    formData.append('siteId', siteId)
    formData.append('file', file)
    const response = await apiClient.post<DeployPreview>('/deploy/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },
  confirm: async (data: ConfirmDeployRequest): Promise<ConfirmDeployResponse> => {
    const response = await apiClient.post<ConfirmDeployResponse>('/deploy/confirm', data)
    return response.data
  },
}
