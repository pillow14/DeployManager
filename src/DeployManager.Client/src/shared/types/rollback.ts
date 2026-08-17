export interface RollbackExecution {
  id: string
  originalExecutionId: string
  siteId: string
  siteName: string
  environmentName: string
  status: string
  executedByUserName: string | null
  reason: string
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  createdAt: string
  details: RollbackExecutionDetail[]
}

export interface RollbackExecutionDetail {
  id: string
  relativePath: string
  originalTargetFile: string | null
  backupFile: string | null
  action: string
  status: string
  message: string | null
}

export interface RollbackPreview {
  originalDeployJobId: string
  siteName: string
  environmentName: string
  fileName: string
  deployedAt: string
  backupPath: string
  totalFiles: number
  filesToRestore: number
  filesToDelete: number
  totalSizeBytes: number
  files: RollbackPreviewFile[]
}

export interface RollbackPreviewFile {
  relativePath: string
  sizeInBytes: number
  existedBeforeDeploy: boolean
  createdByDeploy: boolean
  action: string
  willBe: string
}

export interface ExecuteRollbackRequest {
  originalDeployJobId: string
  reason: string
}
