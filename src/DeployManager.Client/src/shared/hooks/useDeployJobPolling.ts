import { useRef, useCallback, useState, useEffect } from 'react'
import { deployJobsApi } from '@/shared/api/deployJobs'
import type { DeployJobDetail } from '@/shared/types/deployJob'

const POLL_INTERVAL = 1500
const TERMINAL_STATUSES = ['Completed', 'Failed', 'RolledBack']

export function useDeployJobPolling(jobId: string | null) {
  const [data, setData] = useState<DeployJobDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef(jobId)

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPolling = useCallback((id: string) => {
    stopPolling()

    const fetch = async () => {
      try {
        const result = await deployJobsApi.getById(id)
        setData(result)
        setError(null)

        if (TERMINAL_STATUSES.includes(result.status)) {
          stopPolling()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener el estado del despliegue')
        stopPolling()
      }
    }

    fetch()
    intervalRef.current = setInterval(fetch, POLL_INTERVAL)
  }, [stopPolling])

  useEffect(() => {
    if (jobId) {
      jobIdRef.current = jobId
      startPolling(jobId)
    } else {
      setData(null)
      setError(null)
      stopPolling()
    }

    return stopPolling
  }, [jobId, startPolling, stopPolling])

  return { data, error }
}
