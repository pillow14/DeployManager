import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, ToggleLeft, Trash2 } from 'lucide-react'
import type { Resolver } from 'react-hook-form'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Badge } from '@/shared/ui/Badge'
import { Table } from '@/shared/ui/Table'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useDeployRules, useCreateDeployRule, useUpdateDeployRule, useDeleteDeployRule } from '@/shared/hooks/useDeployRules'
import type { DeployRule } from '@/shared/types/deployRule'
import type { Column } from '@/shared/ui/Table'

const ACTIONS = [
  { value: 'copy_overwrite', label: 'Copiar y Sobrescribir' },
  { value: 'copy_if_not_exists', label: 'Copiar si no Existe' },
  { value: 'omit', label: 'Omitir' },
  { value: 'backup_and_copy', label: 'Respaldar y Copiar' },
  { value: 'delete_and_copy', label: 'Eliminar y Copiar' },
] as const

const ruleSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  sourcePattern: z.string().min(1, 'El patrón origen es obligatorio'),
  destinationPath: z.string().min(1, 'La ruta destino es obligatoria'),
  action: z.string().min(1, 'La acción es obligatoria'),
  order: z.coerce.number().int().min(0, 'El orden debe ser un número positivo'),
})

type RuleForm = z.infer<typeof ruleSchema>

const actionColors: Record<string, string> = {
  copy_overwrite: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  copy_if_not_exists: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  omit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  backup_and_copy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delete_and_copy: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const actionLabels: Record<string, string> = {}
ACTIONS.forEach((a) => { actionLabels[a.value] = a.label })

export function RulesPage() {
  const { data: rules, isLoading } = useDeployRules()
  const createMutation = useCreateDeployRule()
  const updateMutation = useUpdateDeployRule()
  const deleteMutation = useDeleteDeployRule()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeployRule | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema) as Resolver<RuleForm>,
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', sourcePattern: '', destinationPath: '', action: 'copy_overwrite', order: 0 })
    setModalOpen(true)
  }

  const openEdit = (rule: DeployRule) => {
    setEditing(rule)
    reset({ name: rule.name, sourcePattern: rule.sourcePattern, destinationPath: rule.destinationPath, action: rule.action, order: rule.order })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const onSubmit = async (data: RuleForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: { name: data.name, sourcePattern: data.sourcePattern, destinationPath: data.destinationPath, action: data.action, order: data.order, id: editing.id, isActive: editing.isActive },
        })
        await Swal.fire({ icon: 'success', title: 'Regla actualizada', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync(data)
        await Swal.fire({ icon: 'success', title: 'Regla creada', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar la regla.' })
    }
  }

  const handleToggle = async (rule: DeployRule) => {
    try {
      await updateMutation.mutateAsync({
        id: rule.id,
        data: { name: rule.name, sourcePattern: rule.sourcePattern, destinationPath: rule.destinationPath, action: rule.action, order: rule.order, id: rule.id, isActive: !rule.isActive },
      })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar la regla.' })
    }
  }

  const handleDelete = async (rule: DeployRule) => {
    const result = await Swal.fire({
      title: '¿Eliminar regla?',
      text: `¿Estás seguro de eliminar "${rule.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync(rule.id)
      await Swal.fire({ icon: 'success', title: 'Regla eliminada', timer: 1500, showConfirmButton: false })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar la regla.' })
    }
  }

  const columns: Column<DeployRule>[] = [
    { key: 'order', header: 'Orden', cell: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.order}</span> },
    { key: 'name', header: 'Nombre', cell: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span> },
    { key: 'sourcePattern', header: 'Patrón Origen', cell: (r) => <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">{r.sourcePattern}</code> },
    { key: 'destinationPath', header: 'Ruta Destino', className: 'max-w-[200px] truncate' },
    { key: 'action', header: 'Acción', cell: (r) => <Badge variant="info">{actionLabels[r.action] ?? r.action}</Badge> },
    { key: 'isActive', header: 'Estado', cell: (r) => <StatusBadge status={r.isActive ? 'Activo' : 'Inactivo'} dot /> },
    {
      key: 'actions', header: 'Acciones', className: 'text-right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400" title="Editar">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleToggle(r)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-orange-600 dark:hover:bg-gray-800 dark:hover:text-orange-400" title={r.isActive ? 'Desactivar' : 'Activar'}>
            <ToggleLeft className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(r)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400" title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingState message="Cargando reglas de despliegue..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reglas de Despliegue"
        description="Define reglas de transformación de archivos aplicadas durante los despliegues"
        actions={
          <Button onClick={openCreate} variant="primary">
            <Plus className="mr-2 h-4 w-4" /> Nueva Regla
          </Button>
        }
      />

      {!rules?.length ? (
        <EmptyState
          title="No hay reglas"
          description="Crea tu primera regla de despliegue para controlar el comportamiento de los archivos."
          action={<Button onClick={openCreate} variant="primary"><Plus className="mr-2 h-4 w-4" /> Agregar Regla</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Table columns={columns} data={rules} keyExtractor={(r) => r.id} />
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Regla' : 'Nueva Regla'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="name" label="Nombre *" placeholder="ej. Ignorar archivos de configuración" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="sourcePattern" label="Patrón Origen *" placeholder="ej. *.config" error={errors.sourcePattern?.message} {...register('sourcePattern')} />
            <Input id="destinationPath" label="Ruta Destino *" placeholder="ej. /backup/config/" error={errors.destinationPath?.message} {...register('destinationPath')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acción *</label>
              <select id="action" className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" {...register('action')}>
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              {errors.action && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errors.action.message}</p>}
            </div>
            <Input id="order" label="Orden *" type="number" placeholder="ej. 1" error={errors.order?.message} {...register('order')} />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Actualizar Regla' : 'Crear Regla'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
