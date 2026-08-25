import { useState } from 'react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { MetricCard } from '@/shared/ui/MetricCard'
import { Button } from '@/shared/components/Button'
import { Textarea } from '@/shared/components/Textarea'
import { Select } from '@/shared/components/Select'
import { useDeployJobs } from '@/shared/hooks/useDeployJobs'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import { useRollbackPreview, useExecuteRollback } from '@/shared/hooks/useRollback'
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
  const executeRollback = useExecuteRollback()
  const [rollbackJobId, setRollbackJobId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const { data: rollbackPreview } = useRollbackPreview(rollbackJobId || '')

  const totalJobs = jobs?.length ?? 0
  const completed = jobs?.filter((j) => j.status === 'Completed').length ?? 0
  const failed = jobs?.filter((j) => j.status === 'Failed').length ?? 0
  const pending = jobs?.filter((j) => j.status === 'Pending' || j.status === 'InProgress').length ?? 0

  return (
    <div className="space-y-xl">
      <PageHeader
        title="Historial de despliegues"
        description="Registro detallado de todas las ejecuciones y estados del pipeline."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter animate-fade-in">
        <MetricCard
          label="Total Despliegues"
          value={totalJobs}
          icon={<span className="material-symbols-outlined">analytics</span>}
        />
        <MetricCard
          label="Completados"
          value={completed}
          icon={<span className="material-symbols-outlined">task_alt</span>}
          variant="success"
          trend={completed > 0 ? { direction: 'up', value: `${completed} total` } : undefined}
        />
        <MetricCard
          label="Fallidos"
          value={failed}
          icon={<span className="material-symbols-outlined">error</span>}
          variant="danger"
          trend={failed > 0 ? { direction: 'down', value: `${failed} total` } : undefined}
        />
        <MetricCard
          label="En Progreso"
          value={pending}
          icon={<span className="material-symbols-outlined">schedule</span>}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-md animate-fade-in delay-100">
        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant space-y-sm hover:border-outline transition-colors">
          <label className="text-label-code text-outline flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">check_circle</span> Estado
          </label>
          <Select
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            placeholder="Cualquier estado"
          >
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s === 'InProgress' ? 'En proceso' : s}</option>
            ))}
          </Select>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant space-y-sm hover:border-outline transition-colors">
          <label className="text-label-code text-outline flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">layers</span> Entorno
          </label>
          <Select
            value={filters.environmentId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, environmentId: e.target.value || undefined }))}
            placeholder="Todos los entornos"
          >
            {environments?.map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </Select>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant space-y-sm hover:border-outline transition-colors">
          <label className="text-label-code text-outline flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span> Desde
          </label>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface font-mono cursor-pointer focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container focus:outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant space-y-sm hover:border-outline transition-colors">
          <label className="text-label-code text-outline flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span> Hasta
          </label>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface font-mono cursor-pointer focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container focus:outline-none"
          />
        </div>
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setFilters({})}
            className="text-label-code text-outline hover:text-primary-container transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Cargando historial de despliegues..." />
      ) : !jobs?.length ? (
        <EmptyState
          title="Sin historial de despliegues"
          description="Los despliegues aparecerán aquí una vez que comiences a desplegar."
        />
      ) : (
        <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden animate-fade-in delay-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">ID</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Sitio</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Fecha</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Estado</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Duración</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {jobs!.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                  onClick={async () => {
                    await Swal.fire({
                      title: `Despliegue: ${job.fileName}`,
                      html: `
                        <div style="text-align:left; font-family: Geist, sans-serif;">
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
                      customClass: { popup: 'swal-dark' },
                    })
                  }}
                >
                  <td className="px-lg py-md">
                    <span className="font-mono text-primary-container font-medium">#{job.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex flex-col">
                      <span className="text-body-sm font-semibold text-on-surface group-hover:text-primary-container transition-colors">{job.siteName}</span>
                      <span className="text-label-code text-outline">{job.fileName}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md font-mono text-body-sm text-on-surface-variant">
                    {new Date(job.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-lg py-md">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-lg py-md font-mono text-body-sm text-on-surface-variant">
                    {formatDuration(job.startedAt, job.completedAt)}
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {job.status === 'Completed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRollbackJobId(job.id); setReason('') }}
                          className="px-sm py-1 text-label-code font-semibold text-error hover:bg-error/10 border border-transparent hover:border-error rounded transition-colors"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!rollbackJobId} onClose={() => { setRollbackJobId(null); setReason('') }} title="Previsualización de Rollback" size="xl">
        {rollbackPreview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-md border border-outline-variant">
              <div>
                <p className="text-label-code text-outline">Sitio</p>
                <p className="text-body-sm font-medium text-on-surface">{rollbackPreview.siteName}</p>
              </div>
              <div>
                <p className="text-label-code text-outline">Entorno</p>
                <p className="text-body-sm font-medium text-on-surface">{rollbackPreview.environmentName}</p>
              </div>
              <div>
                <p className="text-label-code text-outline">Archivo</p>
                <p className="text-body-sm font-medium text-on-surface">{rollbackPreview.fileName}</p>
              </div>
              <div>
                <p className="text-label-code text-outline">Archivos a restaurar</p>
                <p className="text-body-sm font-medium text-primary-container">{rollbackPreview.filesToRestore}</p>
              </div>
              <div>
                <p className="text-label-code text-outline">Archivos a eliminar</p>
                <p className="text-body-sm font-medium text-error">{rollbackPreview.filesToDelete}</p>
              </div>
              <div>
                <p className="text-label-code text-outline">Total</p>
                <p className="text-body-sm font-medium text-on-surface">{rollbackPreview.totalFiles} archivos</p>
              </div>
            </div>

            <div>
              <Textarea
                id="rollback-reason"
                label={<>Motivo del rollback <span className="text-error">*</span></>}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describa el motivo del rollback..."
              />
            </div>

            <div className="flex justify-end gap-sm border-t border-outline-variant pt-md">
              <Button variant="outline" onClick={() => { setRollbackJobId(null); setReason('') }}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!rollbackJobId || !reason.trim()) return
                  const result = await Swal.fire({
                    title: '¿Confirmar Rollback?',
                    text: `Se revertirán ${rollbackPreview.totalFiles} archivos. Esta acción no se puede deshacer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ffb4ab',
                    cancelButtonColor: '#3a4a3f',
                    confirmButtonText: 'Sí, ejecutar rollback',
                    cancelButtonText: 'Cancelar',
                  })
                  if (!result.isConfirmed) return
                  try {
                    await executeRollback.mutateAsync({ originalDeployJobId: rollbackJobId, reason: reason.trim() })
                    await Swal.fire({ icon: 'success', title: 'Rollback ejecutado', timer: 3000 })
                    setRollbackJobId(null)
                    setReason('')
                  } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Ocurrió un error inesperado'
                    await Swal.fire({ icon: 'error', title: 'Error', text: msg })
                  }
                }}
                disabled={!reason.trim() || executeRollback.isPending}
                isLoading={executeRollback.isPending}
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Ejecutar Rollback
              </Button>
            </div>
          </div>
        ) : (
          <LoadingState message="Cargando previsualización..." />
        )}
      </Modal>
    </div>
  )
}
