export interface DeployRule {
  id: string
  name: string
  sourcePattern: string
  destinationPath: string
  action: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateDeployRuleRequest {
  name: string
  sourcePattern: string
  destinationPath: string
  action: string
  order: number
  isActive?: boolean
}

export interface UpdateDeployRuleRequest extends CreateDeployRuleRequest {
  id: string
  isActive: boolean
}
