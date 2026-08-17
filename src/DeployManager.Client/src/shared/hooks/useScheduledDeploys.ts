import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduledDeploysApi } from '@/shared/api/scheduledDeploys'
import type { CreateScheduledDeployRequest, UpdateScheduledDeployRequest } from '@/shared/types/scheduledDeploy'

export function useScheduledDeploys() {
  return useQuery({
    queryKey: ['scheduled-deploys'],
    queryFn: () => scheduledDeploysApi.getAll(),
    refetchInterval: 15000,
  })
}

export function useScheduledDeploy(id: string) {
  return useQuery({
    queryKey: ['scheduled-deploy', id],
    queryFn: () => scheduledDeploysApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateScheduledDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateScheduledDeployRequest) => scheduledDeploysApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-deploys'] })
    },
  })
}

export function useUpdateScheduledDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateScheduledDeployRequest }) =>
      scheduledDeploysApi.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-deploys'] })
    },
  })
}

export function useCancelScheduledDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => scheduledDeploysApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-deploys'] })
    },
  })
}
