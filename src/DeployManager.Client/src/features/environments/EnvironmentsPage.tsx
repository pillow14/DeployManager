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
import { Select } from '@/shared/components/Select'
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
    reset({ name: env.name, description: env.description, targetType: env.targetType, targetUrl: env.targetUrl })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = async (data: EnvironmentForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: { ...data, description: data.description ?? '', id: editing.id, isActive: editing.isActive } })
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
    const result = await Swal.fire({ title: '¿Eliminar entorno?', text: `¿Estás seguro de eliminar "${env.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' })
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
    <div className="space-y-xl">
      <PageHeader title="Entornos" description="Gestiona los entornos de despliegue" actions={
        <Button onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span> Agregar Entorno</Button>
      } />

      {!environments?.length ? (
        <EmptyState title="No hay entornos" description="Crea tu primer entorno para comenzar."
          action={<Button onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span> Agregar Entorno</Button>}
        />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Nombre</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Tipo Destino</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">URL Destino</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Estado</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {environments!.map((env) => (
                <tr key={env.id} className="hover:bg-surface-container-highest transition-colors group">
                  <td className="px-lg py-md">
                    <div className="text-body-sm font-semibold text-on-surface group-hover:text-primary-container transition-colors">{env.name}</div>
                    {env.description && <div className="text-label-code text-outline">{env.description}</div>}
                  </td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{env.targetType}</td>
                  <td className="px-lg py-md font-mono text-body-sm text-on-surface-variant">{env.targetUrl}</td>
                  <td className="px-lg py-md"><StatusBadge status={env.isActive ? 'Activo' : 'Inactivo'} dot /></td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(env)} className="hover:text-primary-fixed-dim transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(env)} className="hover:text-error transition-colors" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Entorno' : 'Agregar Entorno'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="name" label="Nombre" placeholder="ej. Producción" error={errors.name?.message} {...register('name')} />
          <Input id="description" label="Descripción" placeholder="ej. Entorno de producción" error={errors.description?.message} {...register('description')} />
          <Select id="targetType" label="Tipo Destino *" error={errors.targetType?.message} {...register('targetType')}>
            {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input id="targetUrl" label="URL Destino" placeholder="ej. http://produccion.local" error={errors.targetUrl?.message} {...register('targetUrl')} />
          <div className="flex justify-end gap-sm border-t border-outline-variant pt-md">
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
