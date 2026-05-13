import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { environmentsApi } from '@/shared/api/environments'
import type { CreateEnvironmentRequest, UpdateEnvironmentRequest } from '@/shared/types/environment'

export function useEnvironments() {
  return useQuery({
    queryKey: ['environments'],
    queryFn: () => environmentsApi.getAll(),
  })
}

export function useEnvironment(id: string) {
  return useQuery({
    queryKey: ['environment', id],
    queryFn: () => environmentsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEnvironmentRequest) => environmentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments'] }),
  })
}

export function useUpdateEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnvironmentRequest }) =>
      environmentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments'] }),
  })
}

export function useDeleteEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => environmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments'] }),
  })
}
