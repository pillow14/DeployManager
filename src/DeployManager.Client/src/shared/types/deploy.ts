export interface DeployPreview {
  packageId: string
  siteId: string
  siteName: string
  fileName: string
  fileSize: number
  files: DeployFilePreview[]
  summary: DeploySummary
}

export interface DeployFilePreview {
  filePath: string
  fileSize: number
  action: string
  matchedRule: string | null
  matchedRuleName: string | null
}

export interface DeploySummary {
  totalFiles: number
  toCopy: number
  toOmit: number
  toBackup: number
  toDelete: number
}

export interface ConfirmDeployRequest {
  packageId: string
}

export interface ConfirmDeployResponse {
  jobId: string
}
