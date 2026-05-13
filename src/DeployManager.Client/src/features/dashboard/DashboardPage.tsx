import { useNavigate } from 'react-router-dom'
import { Server, Globe, CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react'
import { MetricCard } from '@/shared/ui/MetricCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/components/Button'
import { CardSkeleton } from '@/shared/ui/Skeleton'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import { useDeployJobs } from '@/shared/hooks/useDeployJobs'
import { PageHeader } from '@/shared/ui/PageHeader'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: sites, isLoading: sitesLoading } = useDeploySites({ includeInactive: true })
  const { data: environments } = useEnvironments()
  const { data: jobs, isLoading: jobsLoading } = useDeployJobs({})

  const totalSites = sites?.length ?? 0
  const activeSites = sites?.filter((s) => s.isActive).length ?? 0
  const totalEnvs = environments?.length ?? 0

  const successfulDeploys = jobs?.filter((j) => j.status === 'Completed').length ?? 0
  const failedDeploys = jobs?.filter((j) => j.status === 'Failed').length ?? 0
  const pendingDeploys = jobs?.filter((j) => j.status === 'Pending' || j.status === 'InProgress').length ?? 0

  const recentJobs = jobs?.slice(0, 5) ?? []

  const isLoading = sitesLoading || jobsLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel Principal"
        description="Resumen de tu infraestructura de despliegue"
        border={false}
        actions={
          <Button onClick={() => navigate('/new-deploy')} variant="primary">
            <Upload className="mr-2 h-4 w-4" />
            Nuevo Despliegue
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Sitios"
            value={totalSites}
            icon={<Server className="h-5 w-5" />}
            trend={activeSites > 0 ? { direction: 'up', value: `${activeSites} activos` } : undefined}
          />
          <MetricCard
            label="Entornos"
            value={totalEnvs}
            icon={<Globe className="h-5 w-5" />}
          />
          <MetricCard
            label="Despliegues Exitosos"
            value={successfulDeploys}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
          />
          <MetricCard
            label="Despliegues Fallidos"
            value={failedDeploys}
            icon={<AlertCircle className="h-5 w-5" />}
            variant="danger"
          />
          <MetricCard
            label="Despliegues Pendientes"
            value={pendingDeploys}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Despliegues Recientes</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
                Ver todos
              </Button>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Upload className="mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Aún no hay despliegues</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/new-deploy')}>
                  Iniciar primer despliegue
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">{job.siteName ?? job.id}</p>
                      <p className="text-xs text-gray-500">
                        {job.environmentName} &middot; {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={job.status} dot />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Infraestructura</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {totalEnvs === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  No hay entornos configurados
                </div>
              ) : (
                environments?.map((env) => (
                  <div key={env.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Globe className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{env.name}</p>
                        <p className="text-xs text-gray-500">
                          {sites?.filter((s) => s.environmentId === env.id).length ?? 0} sitios
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={env.isActive ? 'Activo' : 'Inactivo'} dot />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
