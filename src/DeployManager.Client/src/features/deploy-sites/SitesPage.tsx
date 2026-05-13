import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useDeploySites, useCreateDeploySite, useUpdateDeploySite, useDeleteDeploySite } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import type { DeploySite } from '@/shared/types/deploySite'

const TARGET_TYPES = ['IIS', 'AzureAppService', 'FTPS', 'UNC'] as const

const siteSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  environmentId: z.string().min(1, 'Environment is required'),
  targetType: z.string().min(1, 'Target type is required'),
  rootPath: z.string().min(1, 'Root path is required'),
  publicUrl: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

type SiteForm = z.infer<typeof siteSchema>

export function SitesPage() {
  const [filters, setFilters] = useState<{ environmentId?: string }>({})
  const { data: sites, isLoading } = useDeploySites({ ...filters, includeInactive: true })
  const { data: environments } = useEnvironments()
  const createMutation = useCreateDeploySite()
  const updateMutation = useUpdateDeploySite()
  const deleteMutation = useDeleteDeploySite()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeploySite | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ code: '', name: '', environmentId: '', targetType: 'IIS', rootPath: '', publicUrl: '', username: '', password: '' })
    setModalOpen(true)
  }

  const openEdit = (site: DeploySite) => {
    setEditing(site)
    reset({
      code: site.code,
      name: site.name,
      environmentId: site.environmentId,
      targetType: site.targetType,
      rootPath: site.rootPath,
      publicUrl: site.publicUrl ?? '',
      username: site.username ?? '',
      password: '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const onSubmit = async (data: SiteForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: { ...data, publicUrl: data.publicUrl || undefined, username: data.username || undefined, password: data.password || undefined, id: editing.id, isActive: editing.isActive },
        })
        await Swal.fire({ icon: 'success', title: 'Site updated', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync({ ...data, publicUrl: data.publicUrl || undefined, username: data.username || undefined, password: data.password || undefined })
        await Swal.fire({ icon: 'success', title: 'Site created', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save site.' })
    }
  }

  const handleToggleActive = async (site: DeploySite) => {
    try {
      await updateMutation.mutateAsync({
        id: site.id,
        data: {
          code: site.code,
          name: site.name,
          environmentId: site.environmentId,
          targetType: site.targetType,
          rootPath: site.rootPath,
          publicUrl: site.publicUrl ?? undefined,
          username: site.username ?? undefined,
          id: site.id,
          isActive: !site.isActive,
        },
      })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update site.' })
    }
  }

  const handleDelete = async (site: DeploySite) => {
    const result = await Swal.fire({
      title: 'Delete site?',
      text: `Are you sure you want to delete "${site.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync({ id: site.id })
      await Swal.fire({ icon: 'success', title: 'Site deleted', timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete site.'
      await Swal.fire({ icon: 'error', title: 'Error', text: message })
    }
  }

  if (isLoading) return <LoadingState message="Loading deploy sites..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deploy Sites"
        description="Manage deployment target sites"
        actions={
          <Button onClick={openCreate} variant="primary">Add Site</Button>
        }
      />

      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <select
          value={filters.environmentId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, environmentId: e.target.value || undefined }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by environment"
        >
          <option value="">All environments</option>
          {environments?.map((env) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>

      {!sites?.length ? (
        <EmptyState
          icon="dns"
          title="No deploy sites"
          description="Create your first deploy site to get started."
          action={<Button onClick={openCreate} variant="primary">Add Site</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Environment</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Target Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Root Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sites!.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{site.code}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{site.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{site.environmentName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{site.targetType}</td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-gray-700" title={site.rootPath}>{site.rootPath}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button onClick={() => handleToggleActive(site)} className="cursor-pointer">
                      <StatusBadge status={site.isActive ? 'Active' : 'Inactive'} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEdit(site)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(site)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Site' : 'Add Site'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="code"
              label="Code"
              placeholder="e.g. PROD-WEB-01"
              error={errors.code?.message}
              {...register('code')}
            />
            <Input
              id="name"
              label="Name"
              placeholder="e.g. Production Web Server"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="environmentId" className="block text-sm font-medium text-gray-700">Environment</label>
            <select
              id="environmentId"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('environmentId')}
            >
              <option value="">Select environment...</option>
              {environments?.map((env) => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            {errors.environmentId && <p className="text-sm text-red-600" role="alert">{errors.environmentId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="targetType" className="block text-sm font-medium text-gray-700">Target Type</label>
              <select
                id="targetType"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('targetType')}
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.targetType && <p className="text-sm text-red-600" role="alert">{errors.targetType.message}</p>}
            </div>
            <Input
              id="rootPath"
              label="Root Path"
              placeholder="e.g. C:\inetpub\wwwroot"
              error={errors.rootPath?.message}
              {...register('rootPath')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="publicUrl"
              label="Public URL (optional)"
              placeholder="e.g. https://example.com"
              error={errors.publicUrl?.message}
              {...register('publicUrl')}
            />
            <Input
              id="username"
              label="Username (optional)"
              placeholder="e.g. deployuser"
              error={errors.username?.message}
              {...register('username')}
            />
          </div>

          <Input
            id="password"
            label={editing ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            placeholder={editing ? 'Leave blank to keep current' : 'Enter password'}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
