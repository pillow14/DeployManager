import apiClient from './client'
import type { PackageDto } from '@/shared/types/package'

export const packagesApi = {
  getAll: async (): Promise<PackageDto[]> => {
    const response = await apiClient.get<PackageDto[]>('/packages')
    return response.data
  },

  upload: async (file: File): Promise<PackageDto> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<PackageDto>('/packages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },

  getDownloadUrl: (id: string): string => `/api/packages/${id}/download`,
}
