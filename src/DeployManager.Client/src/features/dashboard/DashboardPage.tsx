import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/shared/ui/MetricCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/components/Button'
import { CardSkeleton } from '@/shared/ui/Skeleton'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import { useDeployJobs } from '@/shared/hooks/useDeployJobs'


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
    <div className="space-y-xl">
      <div className="flex justify-between items-end mb-xl animate-fade-in">
        <div>
          <h2 className="text-headline-lg text-on-surface tracking-tight">Dashboard principal</h2>
          <p className="text-body-lg text-on-surface-variant">Resumen operativo de tus infraestructuras .NET</p>
        </div>
        <Button onClick={() => navigate('/new-deploy')}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo despliegue
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter animate-fade-in delay-200">
          <MetricCard
            label="Total Sitios"
            value={totalSites}
            icon={<span className="material-symbols-outlined">language</span>}
            trend={activeSites > 0 ? { direction: 'up', value: `${activeSites} activos` } : undefined}
          />
          <MetricCard
            label="Despliegues Exitosos"
            value={successfulDeploys}
            icon={<span className="material-symbols-outlined">check_circle</span>}
            variant="success"
          />
          <MetricCard
            label="Fallidos"
            value={failedDeploys}
            icon={<span className="material-symbols-outlined">error</span>}
            variant="danger"
          />
          <MetricCard
            label="Pendientes"
            value={pendingDeploys}
            icon={<span className="material-symbols-outlined">schedule</span>}
            variant="warning"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter animate-fade-in delay-300">
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="text-title-md text-on-surface">Despliegues Recientes</h3>
            <button
              className="text-primary-container font-bold text-label-code hover:underline"
              onClick={() => navigate('/history')}
            >
              Ver historial completo
            </button>
          </div>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">rocket_launch</span>
              <p className="text-body-sm text-outline">Aún no hay despliegues</p>
              <Button size="sm" className="mt-3" onClick={() => navigate('/new-deploy')}>
                Iniciar primer despliegue
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-lowest">
                    <th className="px-lg py-md text-label-code font-bold text-on-surface-variant uppercase tracking-wider">Sitio</th>
                    <th className="px-lg py-md text-label-code font-bold text-on-surface-variant uppercase tracking-wider">Fecha</th>
                    <th className="px-lg py-md text-label-code font-bold text-on-surface-variant uppercase tracking-wider">Ambiente</th>
                    <th className="px-lg py-md text-label-code font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-surface-container-high transition-colors group cursor-pointer" onClick={() => navigate('/history')}>
                      <td className="px-lg py-md">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface group-hover:text-primary-container transition-colors">{job.siteName ?? job.id}</span>
                          <span className="text-label-code text-outline">{job.fileName}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md text-body-sm text-on-surface-variant">
                        {new Date(job.createdAt).toLocaleString('es-CL')}
                      </td>
                      <td className="px-lg py-md">
                        <span className="px-sm py-1 bg-secondary-container/10 border border-secondary-container/30 text-secondary-container rounded text-label-code">
                          {job.environmentName}
                        </span>
                      </td>
                      <td className="px-lg py-md">
                        <StatusBadge status={job.status} dot />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-gutter">
          <div className="bg-surface-container border border-outline-variant rounded-xl shadow-sm p-lg">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-title-md text-on-surface">Infraestructura</h3>
              <span className="material-symbols-outlined text-outline">settings</span>
            </div>
            <div className="space-y-md">
              {totalEnvs === 0 ? (
                <div className="text-center text-body-sm text-outline py-4">
                  No hay entornos configurados
                </div>
              ) : (
                environments?.map((env) => (
                  <div key={env.id} className="flex items-center justify-between p-md bg-surface-container-lowest rounded-lg border border-outline-variant hover:border-primary-container/30 transition-colors">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-container">cloud</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{env.name}</p>
                        <p className="text-label-code text-on-surface-variant">
                          {sites?.filter((s) => s.environmentId === env.id).length ?? 0} sitios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs text-label-code text-primary-container font-bold">
                      <StatusBadge status={env.isActive ? 'Activo' : 'Inactivo'} dot />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface-container border border-primary-container/30 rounded-xl p-lg flex flex-col gap-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-50" />
            <div className="z-10">
              <h4 className="font-bold text-title-md mb-xs text-primary-container">Estado del Sistema</h4>
              <p className="text-body-sm text-on-surface mb-md">Tus servicios están respondiendo correctamente.</p>
              <div className="flex items-center gap-lg">
                <div>
                  <div className="text-title-md font-bold text-on-surface">{totalSites}</div>
                  <div className="text-label-code text-on-surface-variant">Sitios Activos</div>
                </div>
                <div className="w-px h-10 bg-outline-variant" />
                <div>
                  <div className="text-title-md font-bold text-on-surface">{totalEnvs}</div>
                  <div className="text-label-code text-on-surface-variant">Entornos</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 text-primary-container group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
