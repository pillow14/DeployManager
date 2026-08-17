import { useState } from 'react'
import Swal from 'sweetalert2'
import { Eye, Play } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { useRollbackHistory, useRollbackPreview, useExecuteRollback, useRollbackExecution } from '@/shared/hooks/useRollback'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RollbackPage() {
  const { data: executions, isLoading } = useRollbackHistory()
  const executeRollback = useExecuteRollback()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [executingId, setExecutingId] = useState<string | null>(null)

  const { data: preview } = useRollbackPreview(previewId || '')
  const { data: detail } = useRollbackExecution(detailId || '')

  const handleExecute = async () => {
    if (!previewId || !reason.trim()) return

    const result = await Swal.fire({
      title: '¿Confirmar Rollback?',
      text: `Se revertirán ${preview?.totalFiles ?? 0} archivos. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, ejecutar rollback',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    setExecutingId(previewId)
    try {
      await executeRollback.mutateAsync({
        originalDeployJobId: previewId,
        reason: reason.trim(),
      })
      await Swal.fire({
        icon: 'success',
        title: 'Rollback ejecutado',
        text: 'Rollback ejecutado correctamente',
        timer: 3000,
      })
      setPreviewId(null)
      setReason('')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
      })
    } finally {
      setExecutingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rollback"
        description="Restaura versiones anteriores de tus despliegues"
      />

      {isLoading ? (
        <LoadingState message="Cargando historial de rollbacks..." />
      ) : !executions?.length ? (
        <EmptyState
          title="No hay rollbacks disponibles"
          description="Los despliegues completados con respaldos aparecerán aquí para hacer rollback."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sitio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ejecutado por</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Término</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {executions!.map((exec) => (
                <tr key={exec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {exec.siteName}
                    <span className="ml-1 text-xs text-gray-400">({exec.environmentName})</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={exec.status} />
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{exec.reason}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{exec.executedByUserName || '-'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(exec.startedAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(exec.finishedAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => setDetailId(exec.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!previewId} onClose={() => { setPreviewId(null); setReason('') }} title="Previsualización de Rollback" size="xl">
        {preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sitio</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{preview.siteName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entorno</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{preview.environmentName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Archivo</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{preview.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Desplegado</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(preview.deployedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Archivos a restaurar</p>
                <p className="text-sm font-medium text-green-600">{preview.filesToRestore}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Archivos a eliminar</p>
                <p className="text-sm font-medium text-red-600">{preview.filesToDelete}</p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Archivo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Tamaño</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {preview.files.map((f, i) => (
                    <tr key={i} className="text-sm">
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{f.relativePath}</td>
                      <td className="px-4 py-2 text-gray-500">{formatFileSize(f.sizeInBytes)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          f.willBe === 'Restaurado'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {f.willBe}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Motivo del rollback <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                placeholder="Describa el motivo del rollback..."
              />
              <p className="mt-1 text-xs text-gray-400">{reason.length}/500</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setPreviewId(null); setReason('') }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecute}
                disabled={!reason.trim() || executingId === previewId}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                {executingId === previewId ? 'Ejecutando...' : 'Ejecutar Rollback'}
              </button>
            </div>
          </div>
        ) : (
          <LoadingState message="Cargando previsualización..." />
        )}
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detalle de Rollback" size="xl">
        {detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sitio</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detail.siteName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Motivo</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{detail.reason}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ejecutado por</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{detail.executedByUserName || '-'}</p>
              </div>
            </div>

            {detail.errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                {detail.errorMessage}
              </div>
            )}

            {detail.details.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Archivo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {detail.details.map((d) => (
                      <tr key={d.id} className="text-sm">
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{d.relativePath}</td>
                        <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-2 text-gray-500">{d.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <LoadingState message="Cargando detalle..." />
        )}
      </Modal>
    </div>
  )
}
