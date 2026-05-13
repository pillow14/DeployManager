import { useState } from 'react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { MetricCard } from '@/shared/ui/MetricCard'
import { useDeployJobs } from '@/shared/hooks/useDeployJobs'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import type { DeployJobsQueryParams } from '@/shared/types/deployJob'

const STATUS_OPTIONS = ['', 'Pending', 'InProgress', 'Completed', 'Failed', 'RolledBack'] as const

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '-'
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const seconds = Math.floor((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function HistoryPage() {
  const [filters, setFilters] = useState<DeployJobsQueryParams>({})
  const { data: jobs, isLoading } = useDeployJobs(filters)
  const { data: environments } = useEnvironments()

  const totalJobs = jobs?.length ?? 0
  const completed = jobs?.filter((j) => j.status === 'Completed').length ?? 0
  const failed = jobs?.filter((j) => j.status === 'Failed').length ?? 0
  const pending = jobs?.filter((j) => j.status === 'Pending' || j.status === 'InProgress').length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title="Historial de Despliegues" description="Revisa todos los trabajos de despliegue ejecutados" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Despliegues" value={totalJobs} />
        <MetricCard label="Completados" value={completed} trend={completed > 0 ? { direction: 'up', value: `${completed} total` } : undefined} />
        <MetricCard label="Fallidos" value={failed} trend={failed > 0 ? { direction: 'down', value: `${failed} total` } : undefined} />
        <MetricCard label="En Progreso" value={pending} />
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s === 'InProgress' ? 'In Progress' : s}</option>
          ))}
        </select>

        <select
          value={filters.environmentId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, environmentId: e.target.value || undefined }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filtrar por entorno"
        >
          <option value="">Todos los entornos</option>
          {environments?.map((env) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Desde fecha"
        />

        <input
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Hasta fecha"
        />

        {Object.keys(filters).length > 0 && (
          <button
            onClick={() => setFilters({})}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Cargando historial de despliegues..." />
      ) : !jobs?.length ? (
        <EmptyState
          title="Sin historial de despliegues"
          description="Los despliegues aparecerán aquí una vez que comiences a desplegar."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sitio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Entorno</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {jobs!.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800/50"
                  onClick={async () => {
                    await Swal.fire({
                      title: `Despliegue: ${job.fileName}`,
                      html: `
                        <div style="text-align:left">
                          <p><strong>Sitio:</strong> ${job.siteName}</p>
                          <p><strong>Entorno:</strong> ${job.environmentName}</p>
                          <p><strong>Estado:</strong> ${job.status}</p>
                          <p><strong>Archivo:</strong> ${job.fileName} (${formatFileSize(job.fileSize)})</p>
                          <p><strong>Inicio:</strong> ${job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}</p>
                          <p><strong>Término:</strong> ${job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}</p>
                          ${job.logSummary ? `<p><strong>Resumen:</strong> ${job.logSummary}</p>` : ''}
                          ${job.errorMessage ? `<p><strong>Error:</strong> ${job.errorMessage}</p>` : ''}
                          ${job.createdByUsername ? `<p><strong>Creado por:</strong> ${job.createdByUsername}</p>` : ''}
                        </div>
                      `,
                      confirmButtonText: 'Cerrar',
                    })
                  }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{job.siteName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{job.environmentName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {job.fileName}
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({formatFileSize(job.fileSize)})</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatDuration(job.startedAt, job.completedAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
