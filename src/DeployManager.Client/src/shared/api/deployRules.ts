import apiClient from './client'
import type { DeployRule, CreateDeployRuleRequest, UpdateDeployRuleRequest } from '@/shared/types/deployRule'

export const deployRulesApi = {
  getAll: async (): Promise<DeployRule[]> => {
    const response = await apiClient.get<DeployRule[]>('/rules')
    return response.data
  },
  getById: async (id: string): Promise<DeployRule> => {
    const response = await apiClient.get<DeployRule>(`/rules/${id}`)
    return response.data
  },
  create: async (data: CreateDeployRuleRequest): Promise<string> => {
    const response = await apiClient.post<string>('/rules', data)
    return response.data
  },
  update: async (id: string, data: UpdateDeployRuleRequest): Promise<void> => {
    await apiClient.put(`/rules/${id}`, data)
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rules/${id}`)
  },
}
