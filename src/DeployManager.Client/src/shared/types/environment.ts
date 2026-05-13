export interface Environment {
  id: string
  name: string
  description: string
  targetType: string
  targetUrl: string
  isActive: boolean
}

export interface CreateEnvironmentRequest {
  name: string
  description: string
  targetType: string
  targetUrl: string
}

export interface UpdateEnvironmentRequest extends CreateEnvironmentRequest {
  id: string
  isActive: boolean
}
