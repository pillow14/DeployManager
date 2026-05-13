import { useQuery } from '@tanstack/react-query'
import { deployJobsApi } from '@/shared/api/deployJobs'
import type { DeployJobsQueryParams } from '@/shared/types/deployJob'

export function useDeployJobs(params?: DeployJobsQueryParams) {
  return useQuery({
    queryKey: ['deploy-jobs', params],
    queryFn: () => deployJobsApi.getAll(params),
  })
}
