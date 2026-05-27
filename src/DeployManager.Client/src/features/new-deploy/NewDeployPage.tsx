import { useState, useRef, useEffect } from 'react'
import { FileUp, Play, Terminal, Server, CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
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
  copy_overwrite: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300',
  copy_if_not_exists: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  omit: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  backup_and_copy: 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  delete_and_copy: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300',
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }
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
    try {
      const result = await uploadMutation.mutateAsync({ siteId: selectedSiteId, file: selectedFile })
      setPreview(result)
      setStep(2)
    } catch {
      // error handled by mutation state
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    try {
      const { jobId } = await confirmMutation.mutateAsync({ packageId: preview.packageId })
      setDeployJobId(jobId)
      setStep(4)
    } catch {
      // error handled by mutation state
    }
  }

  const hasPreviewData = preview !== null
  const { data: jobDetail } = useDeployJobPolling(deployJobId)

  const statusColors: Record<string, string> = {
    Pending: 'text-blue-500',
    InProgress: 'text-blue-500',
    Completed: 'text-green-500',
    Failed: 'text-red-500',
    RolledBack: 'text-orange-500',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    Pending: <Clock className="h-5 w-5" />,
    InProgress: <Loader className="h-5 w-5 animate-spin" />,
    Completed: <CheckCircle className="h-5 w-5" />,
    Failed: <XCircle className="h-5 w-5" />,
    RolledBack: <Clock className="h-5 w-5" />,
  }

  const statusLabels: Record<string, string> = {
    Pending: 'En cola...',
    InProgress: 'En progreso...',
    Completed: 'Completado exitosamente',
    Failed: 'Falló',
    RolledBack: 'Revertido',
  }

  const progressPct = jobDetail
    ? jobDetail.status === 'Completed' ? 100
      : jobDetail.status === 'Failed' ? 100
      : jobDetail.status === 'RolledBack' ? 100
      : jobDetail.status === 'InProgress' ? 50
      : 10
    : 0

  const progressBarColor = jobDetail?.status === 'Failed' || jobDetail?.status === 'RolledBack'
    ? 'bg-red-500'
    : jobDetail?.status === 'Completed'
      ? 'bg-green-500'
      : 'bg-blue-500'

  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [jobDetail?.logs])

  const logLevelColors: Record<string, string> = {
    Info: 'text-gray-300',
    Warning: 'text-yellow-400',
    Error: 'text-red-400',
  }

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp)
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Despliegue"
        description="Despliega un paquete en un sitio destino en 5 pasos"
        border={false}
      />

      <Stepper steps={STEPS} current={step} className="max-w-3xl" />

      {step === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Seleccionar Sitio Destino</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Elige el sitio donde deseas desplegar el paquete.</p>
          {!sites?.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Server className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay sitios activos disponibles</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => {
                const env = envMap.get(site.environmentId)
                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selectedSiteId === site.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{site.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{site.code}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
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
            <Button variant="primary" disabled={!selectedSiteId} onClick={() => setStep(1)}>
              Siguiente: Subir Paquete
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Subir Paquete</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Sube un archivo ZIP que contenga el build a desplegar.</p>
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'
            }`}
            onClick={() => document.getElementById('zip-upload')?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileUp className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo ZIP'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Solo archivos ZIP, máx 500 MB</p>
            <input
              id="zip-upload"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {uploadMutation.isError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              Error al subir:{' '}
              {uploadMutation.error instanceof AxiosError
                ? (uploadMutation.error.response?.data as { error?: string })?.error ??
                  (uploadMutation.error.response?.data as string) ??
                  uploadMutation.error.message
                : (uploadMutation.error as Error)?.message ?? 'Error desconocido'}
            </p>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
            <Button
              variant="primary"
              disabled={!selectedFile || uploadMutation.isPending}
              isLoading={uploadMutation.isPending}
              onClick={handleUpload}
            >
              {uploadMutation.isPending ? 'Subiendo...' : 'Siguiente: Vista Previa'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && hasPreviewData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Vista Previa de Cambios</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Revisa cómo se manejarán los archivos durante el despliegue.</p>

          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(actionLabels).map(([action, label]) => (
              <span key={action} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionColors[action] ?? ''}`}>
                {label}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Archivo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acción</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Regla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.files.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">Sin archivos en el paquete</td>
                  </tr>
                ) : (
                  preview.files.map((f: DeployFilePreview) => (
                    <tr key={f.filePath} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{f.filePath}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionColors[f.action] ?? 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                          {actionLabels[f.action] ?? f.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                        {f.matchedRuleName ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
            {preview.files.length} archivo(s) en {preview.fileName} &middot;
            Destino: <strong>{selectedSite?.rootPath ?? '—'}</strong> en {selectedSite?.targetType ?? '—'}
            {selectedEnv && <span> &middot; Entorno: {selectedEnv.name}</span>}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Siguiente: Confirmar
            </Button>
          </div>
        </div>
      )}

      {step === 3 && hasPreviewData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Play className="h-5 w-5 shrink-0" />
            <span>Revisa el resumen a continuación y confirma para iniciar el despliegue.</span>
          </div>

          <dl className="divide-y divide-gray-100 dark:divide-gray-700">
            {[
              ['Sitio', selectedSite?.name ?? '—'],
              ['Entorno', selectedEnv?.name ?? selectedSite?.environmentName ?? '—'],
              ['Tipo Destino', selectedSite?.targetType ?? '—'],
              ['Ruta Raíz', selectedSite?.rootPath ?? '—'],
              ['Paquete', preview.fileName],
              ['Archivos totales', String(preview.summary.totalFiles)],
              ['Copiar y sobrescribir', String(preview.summary.toCopy)],
              ['Omitir', String(preview.summary.toOmit)],
              ['Respaldar y copiar', String(preview.summary.toBackup)],
              ['Eliminar y copiar', String(preview.summary.toDelete)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 text-sm">
                <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{value}</dd>
              </div>
            ))}
          </dl>

          {confirmMutation.isError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              Error al confirmar:{' '}
              {confirmMutation.error instanceof AxiosError
                ? (confirmMutation.error.response?.data as { error?: string })?.error ??
                  (confirmMutation.error.response?.data as string) ??
                  confirmMutation.error.message
                : (confirmMutation.error as Error)?.message ?? 'Error desconocido'}
            </p>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button
              variant="primary"
              isLoading={confirmMutation.isPending}
              disabled={confirmMutation.isPending}
              onClick={handleConfirm}
            >
              <Play className="mr-2 h-4 w-4" /> {confirmMutation.isPending ? 'Desplegando...' : 'Iniciar Despliegue'}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Progreso del Despliegue</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {deployJobId
              ? `Despliegue #${deployJobId.slice(0, 8)} — ${selectedSite?.name ?? ''}`
              : 'El despliegue está en progreso.'}
          </p>

          <div className="mb-4 flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <span className={statusColors[jobDetail?.status ?? ''] ?? 'text-gray-400'}>
              {statusIcons[jobDetail?.status ?? ''] ?? <Clock className="h-5 w-5" />}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {statusLabels[jobDetail?.status ?? ''] ?? 'Esperando...'}
            </span>
            {jobDetail?.status === 'InProgress' && (
              <span className="ml-auto text-xs text-gray-400">Actualizando cada 3s...</span>
            )}
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Progreso general</span>
              <span className="text-gray-500 dark:text-gray-400">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className={`h-full rounded-full transition-all duration-700 ${progressBarColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {jobDetail?.status === 'Failed' && jobDetail.errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              <strong>Error:</strong> {jobDetail.errorMessage}
            </div>
          )}

          {jobDetail?.logSummary && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
              {jobDetail.logSummary}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-950 font-mono text-sm dark:border-gray-700">
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 text-xs text-gray-400">
              <Terminal className="h-3.5 w-3.5" />
              Registro de despliegue
              {jobDetail?.status === 'InProgress' && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  En vivo
                </span>
              )}
            </div>
            <div ref={logRef} className="h-48 overflow-y-auto p-4 text-gray-300">
              {(!jobDetail?.logs || jobDetail.logs.length === 0) ? (
                <p className="text-gray-500">Esperando registros del despliegue...</p>
              ) : (
                jobDetail.logs.map((log, i) => (
                  <p key={i} className={`${logLevelColors[log.level] ?? 'text-gray-300'}`}>
                    <span className="text-gray-500">[{formatTime(log.timestamp)}]</span> {log.message}
                  </p>
                ))
              )}
              {jobDetail?.status === 'InProgress' && (
                <p className="animate-pulse text-gray-500">Procesando...</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            {(jobDetail?.status === 'Completed' || jobDetail?.status === 'Failed' || jobDetail?.status === 'RolledBack') && (
              <div className="flex gap-2">
                {jobDetail?.status === 'Completed' && jobDetail?.hasBackup && (
                  <Button variant="primary" onClick={() => deployJobsApi.downloadBackup(jobDetail.id)}>
                    Descargar Respaldo
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.open('/deploy-history', '_self')}>
                  Ver Historial
                </Button>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => { setStep(0); setSelectedSiteId(''); setSelectedFile(null); setPreview(null); setDeployJobId(null) }}>
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
