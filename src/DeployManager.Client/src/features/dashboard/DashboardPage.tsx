import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/PageHeader'
import { MetricCard } from '@/shared/ui/MetricCard'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'

export function DashboardPage() {
  const { data: sites, isLoading: sitesLoading } = useDeploySites({ includeInactive: true })
  const { data: environments, isLoading: envLoading } = useEnvironments()

  if (sitesLoading || envLoading) return <LoadingState message="Loading dashboard..." />

  const totalSites = sites?.length ?? 0
  const activeSites = sites?.filter((s) => s.isActive).length ?? 0
  const inactiveSites = totalSites - activeSites
  const totalEnvironments = environments?.length ?? 0

  const latestSiteDate = sites?.length
    ? [...sites].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your deployment infrastructure" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Sites"
          value={totalSites}
          icon={<span className="material-symbols-outlined">dns</span>}
        />
        <MetricCard
          label="Active Sites"
          value={activeSites}
          icon={<span className="material-symbols-outlined">check_circle</span>}
          trend={activeSites > 0 ? { direction: 'up', value: `${activeSites} active` } : undefined}
        />
        <MetricCard
          label="Inactive Sites"
          value={inactiveSites}
          icon={<span className="material-symbols-outlined">pause_circle</span>}
        />
        <MetricCard
          label="Environments"
          value={totalEnvironments}
          icon={<span className="material-symbols-outlined">layers</span>}
        />
      </div>

      {latestSiteDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Latest site added: <span className="font-medium text-gray-900">{latestSiteDate.name}</span>
            {' '}&mdash; {new Date(latestSiteDate.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/sites"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <span className="material-symbols-outlined text-2xl text-blue-600">dns</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Manage Sites</p>
            <p className="text-xs text-gray-500">View and configure deploy sites</p>
          </div>
        </Link>
        <Link
          to="/environments"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <span className="material-symbols-outlined text-2xl text-green-600">layers</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Environments</p>
            <p className="text-xs text-gray-500">Manage deployment environments</p>
          </div>
        </Link>
        <Link
          to="/rules"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <span className="material-symbols-outlined text-2xl text-purple-600">rule</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Deploy Rules</p>
            <p className="text-xs text-gray-500">Configure deployment rules</p>
          </div>
        </Link>
        <Link
          to="/history"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <span className="material-symbols-outlined text-2xl text-amber-600">history</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Deploy History</p>
            <p className="text-xs text-gray-500">View deployment logs</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
