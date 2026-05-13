import { useState } from 'react'
import { FileUp, Play, Terminal, Server } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Stepper } from '@/shared/ui/Stepper'
import { Button } from '@/shared/components/Button'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'

const STEPS = [
  { label: 'Sitio', description: 'Seleccionar destino' },
  { label: 'Subir', description: 'Elegir paquete' },
  { label: 'Vista Previa', description: 'Revisar cambios' },
  { label: 'Desplegar', description: 'Confirmar y ejecutar' },
  { label: 'Progreso', description: 'Ver registros' },
]

const previewFiles = [
  { name: 'Web.config', action: 'skip', label: 'Skip' },
  { name: 'bin/app.dll', action: 'copy', label: 'Copy' },
  { name: 'bin/app.pdb', action: 'copy', label: 'Copy' },
  { name: 'Views/Home/index.cshtml', action: 'copy', label: 'Copy' },
  { name: 'App_Data/orders.db', action: 'backup', label: 'Backup' },
  { name: 'web.locked.config', action: 'blocked', label: 'Locked' },
  { name: 'new-feature.dll', action: 'newFile', label: 'New' },
]

const actionColors: Record<string, string> = {
  copy: 'border-green-300 bg-green-50 text-green-700',
  skip: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  blocked: 'border-red-300 bg-red-50 text-red-700',
  newFile: 'border-blue-300 bg-blue-50 text-blue-700',
  backup: 'border-purple-300 bg-purple-50 text-purple-700',
}

export function NewDeployPage() {
  const [step, setStep] = useState(0)
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { data: sites } = useDeploySites({ includeInactive: false })
  const { data: environments } = useEnvironments()

  const siteMap = new Map(sites?.map((s) => [s.id, s]) ?? [])
  const selectedSite = selectedSiteId ? siteMap.get(selectedSiteId) : undefined
  const envMap = new Map(environments?.map((e) => [e.id, e]) ?? [])
  const selectedEnv = selectedSite ? envMap.get(selectedSite.environmentId) : undefined

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
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
            onClick={() => document.getElementById('zip-upload')?.click()}
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
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
            <Button variant="primary" disabled={!selectedFile} onClick={() => setStep(2)}>
              Siguiente: Vista Previa
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Vista Previa de Cambios</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Revisa cómo se manejarán los archivos durante el despliegue.</p>

          <div className="mb-4 flex flex-wrap gap-2">
            {(['copy', 'skip', 'blocked', 'newFile', 'backup'] as const).map((a) => (
              <span key={a} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionColors[a]}`}>
                {a === 'newFile' ? 'Nuevo' : a === 'copy' ? 'Copiar' : a === 'skip' ? 'Omitir' : a === 'backup' ? 'Respaldar' : 'Bloqueado'}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Archivo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {previewFiles.map((f) => (
                  <tr key={f.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{f.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionColors[f.action]}`}>
                        {f.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedSite && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
              Destino: <strong>{selectedSite.rootPath}</strong> en {selectedSite.targetType}
              {selectedEnv && <span> &middot; Entorno: {selectedEnv.name}</span>}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Siguiente: Confirmar
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
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
              ['Paquete', selectedFile?.name ?? '—'],
              ['Archivos a copiar', '4'],
              ['Archivos a omitir', '1'],
              ['Archivos a respaldar', '1'],
              ['Archivos nuevos', '1'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 text-sm">
                <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              <Play className="mr-2 h-4 w-4" /> Iniciar Despliegue
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Progreso del Despliegue</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">El despliegue está en progreso. Puedes ver el registro en vivo a continuación.</p>

          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Progreso general</span>
              <span className="text-gray-500 dark:text-gray-400">60%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full w-[60%] rounded-full bg-blue-500 transition-all duration-500" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Copiando archivos</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Respaldo pendiente</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> En progreso</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-950 font-mono text-sm dark:border-gray-700">
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 text-xs text-gray-400">
              <Terminal className="h-3.5 w-3.5" />
              Registro de despliegue
            </div>
            <div className="h-48 overflow-y-auto p-4 text-gray-300">
              <p className="text-green-400">[14:32:01] Conectado al sitio destino</p>
              <p className="text-green-400">[14:32:02] Respaldo iniciado: App_Data/orders.db</p>
              <p className="text-green-400">[14:32:03] Respaldo completado</p>
              <p className="text-gray-400">[14:32:04] Copiando: bin/app.dll</p>
              <p className="text-gray-400">[14:32:05] Copiando: bin/app.pdb</p>
              <p className="text-yellow-400">[14:32:06] Omitiendo: Web.config (regla: Skip)</p>
              <p className="text-gray-400">[14:32:07] Copiando: Views/Home/index.cshtml</p>
              <p className="text-blue-400">[14:32:08] Copiando: new-feature.dll (archivo nuevo)</p>
              <p className="animate-pulse text-gray-500">[14:32:09] Finalizando...</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => { setStep(0); setSelectedSiteId(''); setSelectedFile(null) }}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
