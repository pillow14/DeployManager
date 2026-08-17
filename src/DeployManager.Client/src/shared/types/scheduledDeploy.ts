export interface ScheduledDeploy {
  id: string
  name: string
  siteId: string
  siteName: string
  packageId: string | null
  packageFileName: string | null
  scheduledAt: string
  status: string
  createdByUserName: string
  recipients: string[]
  notifyOnStart: boolean
  notifyOnComplete: boolean
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  jobId: string | null
  errorMessage: string | null
}

export type ScheduledDeployDetail = ScheduledDeploy

export interface CreateScheduledDeployRequest {
  name: string
  siteId: string
  packageId: string | null
  scheduledAt: string
  recipients: string[]
  notifyOnStart: boolean
  notifyOnComplete: boolean
}

export interface UpdateScheduledDeployRequest {
  name: string
  scheduledAt: string
  recipients: string[]
  notifyOnStart: boolean
  notifyOnComplete: boolean
}
