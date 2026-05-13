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

export interface DeployJobsQueryParams {
  status?: string
  from?: string
  to?: string
  siteId?: string
  environmentId?: string
}
