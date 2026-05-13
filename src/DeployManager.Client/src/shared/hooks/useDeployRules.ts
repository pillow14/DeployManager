import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deployRulesApi } from '@/shared/api/deployRules'
import type { CreateDeployRuleRequest, UpdateDeployRuleRequest } from '@/shared/types/deployRule'

export function useDeployRules() {
  return useQuery({
    queryKey: ['deploy-rules'],
    queryFn: () => deployRulesApi.getAll(),
  })
}

export function useCreateDeployRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDeployRuleRequest) => deployRulesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-rules'] }),
  })
}

export function useUpdateDeployRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeployRuleRequest }) =>
      deployRulesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-rules'] }),
  })
}

export function useDeleteDeployRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deployRulesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-rules'] }),
  })
}
