import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rollbackApi } from '@/shared/api/rollback'
import type { ExecuteRollbackRequest } from '@/shared/types/rollback'

export function useRollbackHistory() {
  return useQuery({
    queryKey: ['rollback-history'],
    queryFn: () => rollbackApi.getHistory(),
  })
}

export function useRollbackExecution(id: string) {
  return useQuery({
    queryKey: ['rollback-execution', id],
    queryFn: () => rollbackApi.getById(id),
    enabled: !!id,
  })
}

export function useRollbackPreview(executionId: string) {
  return useQuery({
    queryKey: ['rollback-preview', executionId],
    queryFn: () => rollbackApi.preview(executionId),
    enabled: !!executionId,
  })
}

export function useExecuteRollback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ExecuteRollbackRequest) => rollbackApi.execute(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollback-history'] })
      queryClient.invalidateQueries({ queryKey: ['deploy-jobs'] })
    },
  })
}
