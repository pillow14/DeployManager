import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'

export function RollbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rollback"
        description="Restaura versiones anteriores de tus despliegues"
        border={false}
      />

      <EmptyState
        title="No hay rollbacks disponibles"
        description="Los despliegues completados con respaldos aparecerán aquí para hacer rollback."
      />
    </div>
  )
}
