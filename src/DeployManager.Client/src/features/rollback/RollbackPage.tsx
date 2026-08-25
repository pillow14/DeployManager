import { useState } from 'react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Textarea } from '@/shared/components/Textarea'
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
      title: '¿Confirmar Rollback?', text: `Se revertirán ${preview?.totalFiles ?? 0} archivos.`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ffb4ab', cancelButtonColor: '#3a4a3f',
      confirmButtonText: 'Sí, ejecutar rollback', cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    setExecutingId(previewId)
    try {
      await executeRollback.mutateAsync({ originalDeployJobId: previewId, reason: reason.trim() })
      await Swal.fire({ icon: 'success', title: 'Rollback ejecutado', timer: 3000 })
      setPreviewId(null); setReason('')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      await Swal.fire({ icon: 'error', title: 'Error', text: msg })
    } finally { setExecutingId(null) }
  }

  return (
    <div className="space-y-xl">
      <PageHeader title="Rollback" description="Restaura versiones anteriores de tus despliegues" />

      {isLoading ? (
        <LoadingState message="Cargando historial de rollbacks..." />
      ) : !executions?.length ? (
        <EmptyState title="No hay rollbacks disponibles" description="Los despliegues completados con respaldos aparecerán aquí." />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Sitio</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Estado</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Motivo</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Ejecutado por</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Inicio</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {executions!.map((exec) => (
                <tr key={exec.id} className="hover:bg-surface-container-highest transition-colors group">
                  <td className="px-lg py-md">
                    <span className="font-semibold text-on-surface">{exec.siteName}</span>
                    <span className="ml-1 text-label-code text-outline">({exec.environmentName})</span>
                  </td>
                  <td className="px-lg py-md"><StatusBadge status={exec.status} /></td>
                  <td className="max-w-xs truncate px-lg py-md text-body-sm text-on-surface-variant">{exec.reason}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{exec.executedByUserName || '-'}</td>
                  <td className="px-lg py-md font-mono text-body-sm text-outline">{formatDate(exec.startedAt)}</td>
                  <td className="px-lg py-md text-right">
                    <button onClick={() => setDetailId(exec.id)} className="inline-flex items-center gap-1 px-sm py-1 text-label-code font-semibold text-primary-container hover:bg-primary-container/10 rounded transition-colors">
                      <span className="material-symbols-outlined text-[16px]">visibility</span> Detalle
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
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-md border border-outline-variant">
              <div><p className="text-label-code text-outline">Sitio</p><p className="text-body-sm font-medium text-on-surface">{preview.siteName}</p></div>
              <div><p className="text-label-code text-outline">Entorno</p><p className="text-body-sm font-medium text-on-surface">{preview.environmentName}</p></div>
              <div><p className="text-label-code text-outline">Archivo</p><p className="text-body-sm font-medium text-on-surface">{preview.fileName}</p></div>
              <div><p className="text-label-code text-outline">Desplegado</p><p className="text-body-sm font-medium text-on-surface">{formatDate(preview.deployedAt)}</p></div>
              <div><p className="text-label-code text-outline">Archivos a restaurar</p><p className="text-body-sm font-medium text-primary-container">{preview.filesToRestore}</p></div>
              <div><p className="text-label-code text-outline">Archivos a eliminar</p><p className="text-body-sm font-medium text-error">{preview.filesToDelete}</p></div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-outline-variant">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Archivo</th>
                  <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Tamaño</th>
                  <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Acción</th>
                </tr></thead>
                <tbody className="divide-y divide-outline-variant">
                  {preview.files.map((f, i) => (
                    <tr key={i} className="text-body-sm">
                      <td className="px-md py-2 text-on-surface-variant">{f.relativePath}</td>
                      <td className="px-md py-2 text-outline">{formatFileSize(f.sizeInBytes)}</td>
                      <td className="px-md py-2">
                        <span className={`inline-flex items-center rounded px-sm py-0.5 text-label-code font-bold ${
                          f.willBe === 'Restaurado' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'bg-error/10 text-error border border-error/30'
                        }`}>{f.willBe}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Button variant="outline" onClick={() => { setPreviewId(null); setReason('') }}>Cancelar</Button>
              <Button
                variant="danger"
                onClick={handleExecute}
                disabled={!reason.trim() || executingId === previewId}
                isLoading={executingId === previewId}
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Ejecutar Rollback
              </Button>
            </div>
          </div>
        ) : <LoadingState message="Cargando previsualización..." />}
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detalle de Rollback" size="xl">
        {detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-md border border-outline-variant">
              <div><p className="text-label-code text-outline">Sitio</p><p className="text-body-sm font-medium text-on-surface">{detail.siteName}</p></div>
              <div><p className="text-label-code text-outline">Estado</p><StatusBadge status={detail.status} /></div>
              <div><p className="text-label-code text-outline">Motivo</p><p className="text-body-sm text-on-surface-variant">{detail.reason}</p></div>
              <div><p className="text-label-code text-outline">Ejecutado por</p><p className="text-body-sm text-on-surface-variant">{detail.executedByUserName || '-'}</p></div>
            </div>
            {detail.errorMessage && <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-body-sm text-error">{detail.errorMessage}</div>}
            {detail.details.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-outline-variant">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Archivo</th>
                    <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Estado</th>
                    <th className="px-md py-2 text-label-code font-semibold text-outline uppercase text-xs">Mensaje</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline-variant">
                    {detail.details.map((d) => (
                      <tr key={d.id} className="text-body-sm">
                        <td className="px-md py-2 text-on-surface-variant">{d.relativePath}</td>
                        <td className="px-md py-2"><StatusBadge status={d.status} /></td>
                        <td className="px-md py-2 text-outline">{d.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : <LoadingState message="Cargando detalle..." />}
      </Modal>
    </div>
  )
}
