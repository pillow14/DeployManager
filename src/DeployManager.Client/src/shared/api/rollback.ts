import apiClient from './client'
import type { RollbackExecution, RollbackPreview, ExecuteRollbackRequest } from '@/shared/types/rollback'

export const rollbackApi = {
  getHistory: async (): Promise<RollbackExecution[]> => {
    const response = await apiClient.get<RollbackExecution[]>('/rollback/history')
    return response.data
  },
  getById: async (id: string): Promise<RollbackExecution> => {
    const response = await apiClient.get<RollbackExecution>(`/rollback/${id}`)
    return response.data
  },
  preview: async (executionId: string): Promise<RollbackPreview> => {
    const response = await apiClient.get<RollbackPreview>(`/rollback/preview/${executionId}`)
    return response.data
  },
  execute: async (request: ExecuteRollbackRequest): Promise<RollbackExecution> => {
    const response = await apiClient.post<RollbackExecution>('/rollback', request)
    return response.data
  },
}
