import { Bell, Shield, Database, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Administra la configuración del sistema y preferencias"
        border={false}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Almacenamiento</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Retención y almacenamiento de paquetes</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="retention" label="Retención (días)" type="number" defaultValue={30} />
            <Input id="max-size" label="Tamaño máx. paquete (MB)" type="number" defaultValue={500} />
            <Button variant="primary" size="sm">Guardar</Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
              <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Despliegue</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comportamiento y tiempos de espera</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="timeout" label="Tiempo de espera (segundos)" type="number" defaultValue={300} />
            <Input id="retries" label="Máx. reintentos" type="number" defaultValue={3} />
            <Button variant="primary" size="sm">Guardar</Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Preferencias de alertas y notificaciones</p>
            </div>
          </div>
          <div className="space-y-3">
            {['Despliegue exitoso', 'Despliegue fallido', 'Rollback disponible'].map((item) => (
              <label key={item} className="flex items-center gap-3 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600" defaultChecked />
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </label>
            ))}
            <Button variant="primary" size="sm">Guardar</Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Seguridad</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control de acceso y autenticación</p>
            </div>
          </div>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            La configuración de tokens JWT y el control de acceso por roles se gestionan mediante la configuración del servidor.
          </p>
          <Button variant="primary" size="sm">Ver Configuración</Button>
        </div>
      </div>
    </div>
  )
}
