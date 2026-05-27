export interface PackageDto {
  id: string
  fileName: string
  fileSize: number
  siteName: string | null
  status: string
  createdAt: string
  updatedAt: string | null
}

export interface UploadPackageRequest {
  file: File
}
