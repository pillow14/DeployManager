import { useState, useRef, useEffect } from 'react'
import { AxiosError } from 'axios'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Stepper } from '@/shared/ui/Stepper'
import { Button } from '@/shared/components/Button'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import { useUploadPreview, useConfirmDeploy } from '@/shared/hooks/useDeploy'
import { useDeployJobPolling } from '@/shared/hooks/useDeployJobPolling'
import { deployJobsApi } from '@/shared/api/deployJobs'
import type { DeployPreview, DeployFilePreview } from '@/shared/types/deploy'

const STEPS = [
  { label: 'Sitio', description: 'Seleccionar destino' },
  { label: 'Subir', description: 'Elegir paquete' },
  { label: 'Vista Previa', description: 'Revisar cambios' },
  { label: 'Desplegar', description: 'Confirmar y ejecutar' },
  { label: 'Progreso', description: 'Ver registros' },
]

const actionColors: Record<string, string> = {
  copy_overwrite: 'border-primary-container/30 bg-primary-container/10 text-primary-container',
  copy_if_not_exists: 'border-secondary-container/30 bg-secondary-container/10 text-secondary-container',
  omit: 'border-outline bg-surface-container-high text-on-surface-variant',
  backup_and_copy: 'border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container',
  delete_and_copy: 'border-error/30 bg-error/10 text-error',
}

const actionLabels: Record<string, string> = {
  copy_overwrite: 'Copiar y Sobrescribir',
  copy_if_not_exists: 'Copiar si no existe',
  omit: 'Omitir',
  backup_and_copy: 'Respaldar y Copiar',
  delete_and_copy: 'Eliminar y Copiar',
}

export function NewDeployPage() {
  const [step, setStep] = useState(0)
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<DeployPreview | null>(null)
  const [deployJobId, setDeployJobId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file && file.name.toLowerCase().endsWith('.zip')) setSelectedFile(file) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }

  const { data: sites } = useDeploySites({ includeInactive: false })
  const { data: environments } = useEnvironments()
  const uploadMutation = useUploadPreview()
  const confirmMutation = useConfirmDeploy()

  const siteMap = new Map(sites?.map((s) => [s.id, s]) ?? [])
  const selectedSite = selectedSiteId ? siteMap.get(selectedSiteId) : undefined
  const envMap = new Map(environments?.map((e) => [e.id, e]) ?? [])
  const selectedEnv = selectedSite ? envMap.get(selectedSite.environmentId) : undefined

  const handleUpload = async () => {
    if (!selectedSiteId || !selectedFile) return
    try { const result = await uploadMutation.mutateAsync({ siteId: selectedSiteId, file: selectedFile }); setPreview(result); setStep(2) } catch { /* */ }
  }

  const handleConfirm = async () => {
    if (!preview) return
    try { const { jobId } = await confirmMutation.mutateAsync({ packageId: preview.packageId }); setDeployJobId(jobId); setStep(4) } catch { /* */ }
  }

  const hasPreviewData = preview !== null
  const { data: jobDetail } = useDeployJobPolling(deployJobId)

  const statusIcons: Record<string, string> = {
    Pending: 'schedule', InProgress: 'progress_activity', Completed: 'check_circle', Failed: 'error', RolledBack: 'replay',
  }
  const statusColors: Record<string, string> = {
    Pending: 'text-outline', InProgress: 'text-secondary-container', Completed: 'text-primary-container', Failed: 'text-error', RolledBack: 'text-tertiary-container',
  }
  const statusLabels: Record<string, string> = {
    Pending: 'En cola...', InProgress: 'En progreso...', Completed: 'Completado exitosamente', Failed: 'Falló', RolledBack: 'Revertido',
  }

  const progressPct = jobDetail ? jobDetail.status === 'Completed' ? 100 : jobDetail.status === 'Failed' ? 100 : jobDetail.status === 'RolledBack' ? 100 : jobDetail.status === 'InProgress' ? 50 : 10 : 0
  const progressBarColor = jobDetail?.status === 'Failed' || jobDetail?.status === 'RolledBack' ? 'bg-error' : jobDetail?.status === 'Completed' ? 'bg-primary-container' : 'bg-secondary-container'

  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [jobDetail?.logs])

  const logLevelColors: Record<string, string> = { Info: 'text-on-surface-variant', Warning: 'text-secondary-container', Error: 'text-error' }
  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div className="space-y-xl">
      <PageHeader title="Nuevo Despliegue" description="Despliega un paquete en un sitio destino en 5 pasos" border={false} />
      <Stepper steps={STEPS} current={step} className="max-w-3xl" />

      {step === 0 && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm animate-fade-in">
          <h3 className="mb-1 text-title-md font-bold text-on-surface">Seleccionar Sitio Destino</h3>
          <p className="mb-4 text-body-sm text-on-surface-variant">Elige el sitio donde deseas desplegar el paquete.</p>
          {!sites?.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">cloud_off</span>
              <p className="text-body-sm text-outline">No hay sitios activos disponibles</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => {
                const env = envMap.get(site.environmentId)
                return (
                  <button key={site.id} onClick={() => setSelectedSiteId(site.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selectedSiteId === site.id
                        ? 'border-primary-container bg-primary-container/10 shadow-[0_0_15px_rgba(0,255,159,0.2)]'
                        : 'border-outline-variant bg-surface-container-low hover:border-outline'
                    }`}
                  >
                    <p className="font-bold text-on-surface">{site.name}</p>
                    <p className="mt-0.5 text-label-code text-outline">{site.code}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-outline">
                      <span>{env?.name ?? site.environmentName}</span>
                      <span>&middot;</span>
                      <span>{site.targetType}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button disabled={!selectedSiteId} onClick={() => setStep(1)}>Siguiente: Subir Paquete</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm animate-fade-in">
          <h3 className="mb-1 text-title-md font-bold text-on-surface">Subir Paquete</h3>
          <p className="mb-4 text-body-sm text-on-surface-variant">Sube un archivo ZIP que contenga el build a desplegar.</p>
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant bg-surface-container-lowest hover:border-primary-container/50'
            }`}
            onClick={() => document.getElementById('zip-upload')?.click()}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          >
            <span className="material-symbols-outlined text-4xl text-outline mb-3">upload_file</span>
            <p className="text-body-sm font-medium text-on-surface">{selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo ZIP'}</p>
            <p className="mt-1 text-label-code text-outline">Solo archivos ZIP, máx 500 MB</p>
            <input id="zip-upload" type="file" accept=".zip" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          </div>
          {uploadMutation.isError && (
            <p className="mt-3 text-body-sm text-error">
              Error al subir: {uploadMutation.error instanceof AxiosError ? (uploadMutation.error.response?.data as { error?: string })?.error ?? uploadMutation.error.message : (uploadMutation.error as Error)?.message ?? 'Error desconocido'}
            </p>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
            <Button disabled={!selectedFile || uploadMutation.isPending} isLoading={uploadMutation.isPending} onClick={handleUpload}>
              {uploadMutation.isPending ? 'Subiendo...' : 'Siguiente: Vista Previa'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && hasPreviewData && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm animate-fade-in">
          <h3 className="mb-1 text-title-md font-bold text-on-surface">Vista Previa de Cambios</h3>
          <p className="mb-4 text-body-sm text-on-surface-variant">Revisa cómo se manejarán los archivos durante el despliegue.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(actionLabels).map(([action, label]) => (
              <span key={action} className={`rounded border px-sm py-1 text-label-code font-bold ${actionColors[action] ?? ''}`}>{label}</span>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-outline-variant">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="px-md py-2.5 text-label-code font-semibold text-outline uppercase tracking-wider">Archivo</th>
                  <th className="px-md py-2.5 text-label-code font-semibold text-outline uppercase tracking-wider">Acción</th>
                  <th className="px-md py-2.5 text-label-code font-semibold text-outline uppercase tracking-wider">Regla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {preview.files.length === 0 ? (
                  <tr><td colSpan={3} className="px-md py-6 text-center text-body-sm text-outline">Sin archivos en el paquete</td></tr>
                ) : (
                  preview.files.map((f: DeployFilePreview) => (
                    <tr key={f.filePath} className="hover:bg-surface-container-highest transition-colors">
                      <td className="px-md py-2.5 text-body-sm text-on-surface">{f.filePath}</td>
                      <td className="px-md py-2.5"><span className={`inline-block rounded border px-sm py-0.5 text-label-code font-bold ${actionColors[f.action] ?? 'border-outline-variant bg-surface-container-high text-on-surface-variant'}`}>{actionLabels[f.action] ?? f.action}</span></td>
                      <td className="px-md py-2.5 text-body-sm text-outline">{f.matchedRuleName ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-primary-container/20 bg-primary-container/5 px-md py-3 text-body-sm text-primary-container">
            {preview.files.length} archivo(s) en {preview.fileName} &middot; Destino: <strong>{selectedSite?.rootPath ?? '—'}</strong> en {selectedSite?.targetType ?? '—'}
            {selectedEnv && <span> &middot; Entorno: {selectedEnv.name}</span>}
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)}>Siguiente: Confirmar</Button>
          </div>
        </div>
      )}

      {step === 3 && hasPreviewData && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm animate-fade-in">
          <div className="mb-6 flex items-center gap-sm rounded-lg border border-secondary-container/30 bg-secondary-container/5 px-md py-3 text-body-sm text-secondary-container">
            <span className="material-symbols-outlined">play_circle</span>
            <span>Revisa el resumen a continuación y confirma para iniciar el despliegue.</span>
          </div>
          <dl className="divide-y divide-outline-variant">
            {[
              ['Sitio', selectedSite?.name ?? '—'], ['Entorno', selectedEnv?.name ?? selectedSite?.environmentName ?? '—'],
              ['Tipo Destino', selectedSite?.targetType ?? '—'], ['Ruta Raíz', selectedSite?.rootPath ?? '—'],
              ['Paquete', preview.fileName], ['Archivos totales', String(preview.summary.totalFiles)],
              ['Copiar y sobrescribir', String(preview.summary.toCopy)], ['Omitir', String(preview.summary.toOmit)],
              ['Respaldar y copiar', String(preview.summary.toBackup)], ['Eliminar y copiar', String(preview.summary.toDelete)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 text-sm">
                <dt className="text-outline">{label}</dt>
                <dd className="font-medium text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
          {confirmMutation.isError && (
            <p className="mt-3 text-body-sm text-error">Error al confirmar: {confirmMutation.error instanceof AxiosError ? (confirmMutation.error.response?.data as { error?: string })?.error ?? confirmMutation.error.message : (confirmMutation.error as Error)?.message ?? 'Error desconocido'}</p>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button isLoading={confirmMutation.isPending} disabled={confirmMutation.isPending} onClick={handleConfirm}>
              <span className="material-symbols-outlined text-[18px]">play_arrow</span> {confirmMutation.isPending ? 'Desplegando...' : 'Iniciar Despliegue'}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm animate-fade-in">
          <h3 className="mb-1 text-title-md font-bold text-on-surface">Progreso del Despliegue</h3>
          <p className="mb-4 text-body-sm text-on-surface-variant">
            {deployJobId ? `Despliegue #${deployJobId.slice(0, 8)} — ${selectedSite?.name ?? ''}` : 'El despliegue está en progreso.'}
          </p>

          <div className="mb-4 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-low px-md py-3">
            <span className={statusColors[jobDetail?.status ?? ''] ?? 'text-outline'}>
              <span className="material-symbols-outlined">{statusIcons[jobDetail?.status ?? ''] ?? 'schedule'}</span>
            </span>
            <span className="text-body-sm font-medium text-on-surface">{statusLabels[jobDetail?.status ?? ''] ?? 'Esperando...'}</span>
            {jobDetail?.status === 'InProgress' && <span className="ml-auto text-label-code text-outline">Actualizando cada 1.5s...</span>}
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-body-sm">
              <span className="font-medium text-on-surface-variant">Progreso general</span>
              <span className="text-outline">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div className={`h-full rounded-full transition-all duration-700 ${progressBarColor}`} style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {jobDetail?.status === 'Failed' && jobDetail.errorMessage && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-md py-3 text-body-sm text-error">
              <strong>Error:</strong> {jobDetail.errorMessage}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest font-mono text-sm">
            <div className="flex items-center gap-2 border-b border-outline-variant px-md py-2 text-label-code text-outline">
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              Registro de despliegue
              {jobDetail?.status === 'InProgress' && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                  En vivo
                </span>
              )}
            </div>
            <div ref={logRef} className="h-48 overflow-y-auto p-md text-on-surface-variant">
              {(!jobDetail?.logs || jobDetail.logs.length === 0) ? (
                <p className="text-outline">Esperando registros del despliegue...</p>
              ) : (
                jobDetail.logs.map((log, i) => (
                  <p key={i} className={`${logLevelColors[log.level] ?? 'text-on-surface-variant'}`}>
                    <span className="text-outline">[{formatTime(log.timestamp)}]</span> {log.message}
                  </p>
                ))
              )}
              {jobDetail?.status === 'InProgress' && <p className="animate-pulse text-outline">Procesando...</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            {(jobDetail?.status === 'Completed' || jobDetail?.status === 'Failed' || jobDetail?.status === 'RolledBack') && (
              <div className="flex gap-2">
                {jobDetail?.status === 'Completed' && jobDetail?.hasBackup && (
                  <Button onClick={() => deployJobsApi.downloadBackup(jobDetail.id)}>
                    <span className="material-symbols-outlined text-[18px]">download</span> Descargar Respaldo
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.open('/history', '_self')}>Ver Historial</Button>
              </div>
            )}
            <div className="ml-auto">
              <Button variant="outline" onClick={() => { setStep(0); setSelectedSiteId(''); setSelectedFile(null); setPreview(null); setDeployJobId(null) }}>
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
