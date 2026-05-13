import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
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
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  targetType: z.string().min(1, 'El tipo de destino es obligatorio'),
  targetUrl: z.string().min(1, 'La URL de destino es obligatoria'),
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
        await Swal.fire({ icon: 'success', title: 'Entorno actualizado', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync({ ...data, description: data.description ?? '' })
        await Swal.fire({ icon: 'success', title: 'Entorno creado', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar el entorno.' })
    }
  }

  const handleDelete = async (env: Environment) => {
    const result = await Swal.fire({
      title: '¿Eliminar entorno?',
      text: `¿Estás seguro de eliminar "${env.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync(env.id)
      await Swal.fire({ icon: 'success', title: 'Entorno eliminado', timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el entorno.'
      await Swal.fire({ icon: 'error', title: 'Error', text: message })
    }
  }

  if (isLoading) return <LoadingState message="Cargando entornos..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entornos"
        description="Gestiona los entornos de despliegue"
        actions={
          <Button onClick={openCreate} variant="primary">
            <Plus className="mr-2 h-4 w-4" /> Agregar Entorno
          </Button>
        }
      />

      {!environments?.length ? (
        <EmptyState
          title="No hay entornos"
          description="Crea tu primer entorno para comenzar."
          action={<Button onClick={openCreate} variant="primary"><Plus className="mr-2 h-4 w-4" /> Agregar Entorno</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">URL Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {environments!.map((env) => (
                <tr key={env.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{env.name}</div>
                    {env.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{env.description}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{env.targetType}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{env.targetUrl}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={env.isActive ? 'Activo' : 'Inactivo'} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEdit(env)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(env)}
                      className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Entorno' : 'Agregar Entorno'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            label="Nombre"
            placeholder="ej. Producción"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="description"
            label="Descripción"
            placeholder="ej. Entorno de producción"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="space-y-1">
            <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo Destino
            </label>
            <select
              id="targetType"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              {...register('targetType')}
            >
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.targetType && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errors.targetType.message}</p>
            )}
          </div>
          <Input
            id="targetUrl"
            label="URL Destino"
            placeholder="ej. http://produccion.local"
            error={errors.targetUrl?.message}
            {...register('targetUrl')}
          />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
