import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Checkbox } from '@/shared/components/Checkbox'

export function SettingsPage() {
  return (
    <div className="space-y-xl">
      <PageHeader title="Configuración" description="Administra la configuración del sistema y preferencias" border={false} />

      <div className="grid gap-gutter lg:grid-cols-2">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="mb-lg flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/10 border border-primary-container/30">
              <span className="material-symbols-outlined text-primary-container">database</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Almacenamiento</h3>
              <p className="text-body-sm text-on-surface-variant">Retención y almacenamiento de paquetes</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="retention" label="Retención (días)" type="number" defaultValue={30} />
            <Input id="max-size" label="Tamaño máx. paquete (MB)" type="number" defaultValue={500} />
            <Button size="sm">Guardar</Button>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="mb-lg flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container/10 border border-secondary-container/30">
              <span className="material-symbols-outlined text-secondary-container">refresh</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Despliegue</h3>
              <p className="text-body-sm text-on-surface-variant">Comportamiento y tiempos de espera</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="timeout" label="Tiempo de espera (segundos)" type="number" defaultValue={300} />
            <Input id="retries" label="Máx. reintentos" type="number" defaultValue={3} />
            <Button size="sm">Guardar</Button>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="mb-lg flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-container/10 border border-tertiary-container/30">
              <span className="material-symbols-outlined text-tertiary-container">notifications</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Notificaciones</h3>
              <p className="text-body-sm text-on-surface-variant">Preferencias de alertas y notificaciones</p>
            </div>
          </div>
          <div className="space-y-3">
            {['Despliegue exitoso', 'Despliegue fallido', 'Rollback disponible'].map((item) => (
              <Checkbox
                key={item}
                id={`notif-${item}`}
                label={item}
                defaultChecked
              />
            ))}
            <Button size="sm" className="mt-2">Guardar</Button>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="mb-lg flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 border border-error/30">
              <span className="material-symbols-outlined text-error">shield</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Seguridad</h3>
              <p className="text-body-sm text-on-surface-variant">Control de acceso y autenticación</p>
            </div>
          </div>
          <p className="mb-3 text-body-sm text-on-surface-variant">
            La configuración de tokens JWT y el control de acceso por roles se gestionan mediante la configuración del servidor.
          </p>
          <Button variant="secondary" size="sm">Ver Configuración</Button>
        </div>
      </div>
    </div>
  )
}
