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
import { useEnvironments, useCreateEnvironment, useUpdateEnvironment, useDeleteEnvironment } from '@/shared/hooks/useEnvironments'
import type { Environment } from '@/shared/types/environment'

const TARGET_TYPES = ['IIS', 'AzureAppService', 'FTPS', 'UNC'] as const

const environmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  targetType: z.string().min(1, 'Target type is required'),
  targetUrl: z.string().min(1, 'Target URL is required'),
})

type EnvironmentForm = z.infer<typeof environmentSchema>

export function EnvironmentsPage() {
  const { data: environments, isLoading } = useEnvironments()
  const createMutation = useCreateEnvironment()
  const updateMutation = useUpdateEnvironment()
  const deleteMutation = useDeleteEnvironment()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Environment | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnvironmentForm>({
    resolver: zodResolver(environmentSchema),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', targetType: 'IIS', targetUrl: '' })
    setModalOpen(true)
  }

  const openEdit = (env: Environment) => {
    setEditing(env)
    reset({
      name: env.name,
      description: env.description,
      targetType: env.targetType,
      targetUrl: env.targetUrl,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const onSubmit = async (data: EnvironmentForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: { ...data, description: data.description ?? '', id: editing.id, isActive: editing.isActive },
        })
        await Swal.fire({ icon: 'success', title: 'Environment updated', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync({ ...data, description: data.description ?? '' })
        await Swal.fire({ icon: 'success', title: 'Environment created', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save environment.' })
    }
  }

  const handleDelete = async (env: Environment) => {
    const result = await Swal.fire({
      title: 'Delete environment?',
      text: `Are you sure you want to delete "${env.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync(env.id)
      await Swal.fire({ icon: 'success', title: 'Environment deleted', timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete environment.'
      await Swal.fire({ icon: 'error', title: 'Error', text: message })
    }
  }

  if (isLoading) return <LoadingState message="Loading environments..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environments"
        description="Manage deployment environments"
        actions={
          <Button onClick={openCreate} variant="primary">Add Environment</Button>
        }
      />

      {!environments?.length ? (
        <EmptyState
          title="No environments"
          description="Create your first environment to get started."
          action={<Button onClick={openCreate} variant="primary">Add Environment</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Target Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Target URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {environments!.map((env) => (
                <tr key={env.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{env.name}</div>
                    {env.description && (
                      <div className="text-sm text-gray-500">{env.description}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{env.targetType}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{env.targetUrl}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={env.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEdit(env)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(env)}
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Environment' : 'Add Environment'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            label="Name"
            placeholder="e.g. Production"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="description"
            label="Description"
            placeholder="e.g. Production environment"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="space-y-1">
            <label htmlFor="targetType" className="block text-sm font-medium text-gray-700">
              Target Type
            </label>
            <select
              id="targetType"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('targetType')}
            >
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.targetType && (
              <p className="text-sm text-red-600" role="alert">{errors.targetType.message}</p>
            )}
          </div>
          <Input
            id="targetUrl"
            label="Target URL"
            placeholder="e.g. http://production.local"
            error={errors.targetUrl?.message}
            {...register('targetUrl')}
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
