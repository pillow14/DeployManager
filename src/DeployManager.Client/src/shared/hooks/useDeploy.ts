import { useMutation } from '@tanstack/react-query'
import { deployApi } from '@/shared/api/deploy'
import type { ConfirmDeployRequest } from '@/shared/types/deploy'

export function useUploadPreview() {
  return useMutation({
    mutationFn: ({ siteId, file }: { siteId: string; file: File }) => deployApi.upload(siteId, file),
  })
}

export function useConfirmDeploy() {
  return useMutation({
    mutationFn: (data: ConfirmDeployRequest) => deployApi.confirm(data),
  })
}
