export interface DeployJob {
  id: string
  siteId: string
  siteName: string
  environmentName: string
  fileName: string
  fileSize: number
  status: string
  logSummary: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  createdByUsername: string | null
}

export interface DeployJobDetail extends DeployJob {
  siteCode: string
  targetType: string
  hasBackup: boolean
  logs: DeployLogEntry[]
}

export interface DeployLogEntry {
  timestamp: string
  level: string
  message: string
}

export interface DeployJobsQueryParams {
  status?: string
  from?: string
  to?: string
  siteId?: string
  environmentId?: string
}
