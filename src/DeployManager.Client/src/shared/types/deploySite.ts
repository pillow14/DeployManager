export interface DeploySite {
  id: string
  code: string
  name: string
  environmentId: string
  environmentName: string
  targetType: string
  rootPath: string
  publicUrl: string | null
  username: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateDeploySiteRequest {
  code: string
  name: string
  environmentId: string
  targetType: string
  rootPath: string
  publicUrl?: string
  username?: string
  password?: string
}

export interface UpdateDeploySiteRequest extends CreateDeploySiteRequest {
  id: string
  isActive: boolean
}
