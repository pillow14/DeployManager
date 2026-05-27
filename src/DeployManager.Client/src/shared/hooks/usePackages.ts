import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { packagesApi } from '@/shared/api/packages'
import { USE_MOCK_PACKAGES } from '@/shared/constants'
import type { PackageDto } from '@/shared/types/package'

function mockDelay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 400))
}

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<PackageDto[]> => {
      if (USE_MOCK_PACKAGES) {
        await mockDelay()
        return [
          { id: crypto.randomUUID(), fileName: 'mock-build-v1.0.0.zip', fileSize: 2_456_000, status: 'Uploaded', siteName: 'Sitio Mock 1', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: null },
          { id: crypto.randomUUID(), fileName: 'mock-build-v1.0.1.zip', fileSize: 3_120_000, status: 'Deployed', siteName: 'Sitio Mock 2', createdAt: new Date(Date.now() - 18000000).toISOString(), updatedAt: new Date().toISOString() },
        ]
      }
      return packagesApi.getAll()
    },
  })
}

export function useUploadPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<PackageDto> => {
      if (USE_MOCK_PACKAGES) {
        await mockDelay()
        return { id: crypto.randomUUID(), fileName: file.name, fileSize: file.size, status: 'Uploaded', siteName: null, createdAt: new Date().toISOString(), updatedAt: null }
      }
      return packagesApi.upload(file)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  })
}
