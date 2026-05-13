export interface DeployRule {
  id: string
  pattern: string
  action: string
  order: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateDeployRuleRequest {
  pattern: string
  action: string
  order: number
  isEnabled?: boolean
}

export interface UpdateDeployRuleRequest extends CreateDeployRuleRequest {
  id: string
  isEnabled: boolean
}
