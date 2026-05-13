import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploySitesApi } from '@/shared/api/deploySites'
import type { CreateDeploySiteRequest, UpdateDeploySiteRequest } from '@/shared/types/deploySite'

export function useDeploySites(params?: { environmentId?: string; includeInactive?: boolean }) {
  return useQuery({
    queryKey: ['deploy-sites', params],
    queryFn: () => deploySitesApi.getAll(params),
  })
}

export function useDeploySite(id: string) {
  return useQuery({
    queryKey: ['deploy-site', id],
    queryFn: () => deploySitesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateDeploySite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDeploySiteRequest) => deploySitesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-sites'] }),
  })
}

export function useUpdateDeploySite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeploySiteRequest }) => deploySitesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-sites'] }),
  })
}

export function useDeleteDeploySite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hardDelete }: { id: string; hardDelete?: boolean }) => deploySitesApi.delete(id, hardDelete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deploy-sites'] }),
  })
}
