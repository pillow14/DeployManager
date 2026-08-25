import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import Swal from 'sweetalert2'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Badge } from '@/shared/ui/Badge'
import { Table } from '@/shared/ui/Table'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { useDeployRules, useCreateDeployRule, useUpdateDeployRule, useDeleteDeployRule } from '@/shared/hooks/useDeployRules'
import type { DeployRule } from '@/shared/types/deployRule'
import type { Column } from '@/shared/ui/Table'
import { MetricCard } from '@/shared/ui/MetricCard'

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

const actionLabels: Record<string, string> = {}
ACTIONS.forEach((a) => { actionLabels[a.value] = a.label })

const actionBadgeVariant: Record<string, 'success' | 'info' | 'purple' | 'danger' | 'default'> = {
  copy_overwrite: 'success',
  copy_if_not_exists: 'info',
  omit: 'default',
  backup_and_copy: 'purple',
  delete_and_copy: 'danger',
}

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

  const totalRules = rules?.length ?? 0
  const activeRules = rules?.filter((r) => r.isActive).length ?? 0

  const columns: Column<DeployRule>[] = [
    {
      key: 'order', header: 'Orden', className: 'w-16',
      cell: (r) => (
        <span className="flex items-center gap-xs font-mono text-outline">
          <span className="material-symbols-outlined text-[18px] cursor-grab text-outline hover:text-primary-fixed-dim transition-colors">drag_indicator</span>
          {String(r.order).padStart(2, '0')}
        </span>
      ),
    },
    { key: 'name', header: 'Nombre regla', cell: (r) => <span className="font-semibold text-on-surface">{r.name}</span> },
    {
      key: 'sourcePattern', header: 'Patrón origen',
      cell: (r) => (
        <code className="font-mono bg-surface-container-lowest border border-primary-fixed-dim/30 text-primary-fixed-dim px-sm py-1 rounded shadow-[0_0_8px_rgba(0,227,141,0.2)] text-xs">
          {r.sourcePattern}
        </code>
      ),
    },
    { key: 'destinationPath', header: 'Ruta destino', className: 'max-w-[200px] truncate', cell: (r) => <span className="font-mono text-on-surface-variant text-sm">{r.destinationPath}</span> },
    {
      key: 'action', header: 'Acción',
      cell: (r) => <Badge variant={actionBadgeVariant[r.action] ?? 'default'}>{actionLabels[r.action] ?? r.action}</Badge>,
    },
    {
      key: 'isActive', header: 'Activa', className: 'text-center',
      cell: (r) => (
        <div className="flex justify-center">
          <button
            onClick={() => handleToggle(r)}
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              r.isActive
                ? 'bg-primary-fixed-dim shadow-[0_0_10px_rgba(0,227,141,0.4)]'
                : 'bg-surface-container-lowest border-outline'
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ease-in-out ${
              r.isActive ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      ),
    },
    {
      key: 'actions', header: '', className: 'text-right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openEdit(r)} className="hover:text-primary-fixed-dim transition-colors" title="Editar">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button onClick={() => handleDelete(r)} className="hover:text-error transition-colors" title="Eliminar">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingState message="Cargando reglas de despliegue..." />

  return (
    <div className="space-y-xl">
      <div className="flex items-end justify-between mb-xl animate-fade-in">
        <div>
          <nav className="flex items-center gap-xs text-label-code text-outline mb-sm">
            <span>Configuración</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary-fixed-dim">Reglas de despliegue</span>
          </nav>
          <h2 className="text-headline-lg text-on-surface">Reglas de despliegue</h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mt-xs">
            Define el comportamiento de los archivos durante el proceso de sincronización entre el servidor de compilación y los entornos de destino.
          </p>
        </div>
        <Button onClick={openCreate}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Nueva Regla
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl animate-fade-in delay-100">
        <MetricCard
          label="Total Reglas"
          value={totalRules}
          icon={<span className="material-symbols-outlined">analytics</span>}
        />
        <MetricCard
          label="Activas"
          value={activeRules}
          icon={<span className="material-symbols-outlined">check_circle</span>}
          variant="success"
        />
        <div className="md:col-span-2 bg-surface-container-high border border-primary-fixed-dim/30 text-on-surface p-lg rounded-xl relative overflow-hidden flex flex-col justify-between shadow-[inset_0_0_20px_rgba(0,227,141,0.05)]">
          <div className="relative z-10">
            <h3 className="text-headline-lg font-bold mb-xs text-primary-fixed-dim">Prioridad de Procesamiento</h3>
            <p className="text-body-lg text-on-surface-variant max-w-sm">Las reglas se ejecutan secuencialmente según su orden. Los patrones más específicos deben estar al inicio.</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: '180px' }}>reorder</span>
          </div>
        </div>
      </div>

      {!rules?.length ? (
        <EmptyState
          title="No hay reglas"
          description="Crea tu primera regla de despliegue para controlar el comportamiento de los archivos."
          action={<Button onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add_circle</span> Agregar Regla</Button>}
        />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in delay-200">
          <Table columns={columns} data={rules} keyExtractor={(r) => r.id} />
          <div className="px-lg py-md bg-surface-container-high border-t border-outline-variant flex items-center justify-between">
            <span className="text-label-code text-on-surface-variant">Mostrando {totalRules} reglas configuradas</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter animate-fade-in delay-300">
        <div className="p-lg bg-surface-container border border-outline-variant rounded-xl flex gap-md hover:border-primary-fixed-dim/30 transition-colors">
          <div className="w-12 h-12 bg-primary-fixed-dim/10 rounded-lg flex items-center justify-center shrink-0 border border-primary-fixed-dim/20">
            <span className="material-symbols-outlined text-primary-fixed-dim">lightbulb</span>
          </div>
          <div>
            <h4 className="text-title-md font-bold mb-xs">Tip de Operación</h4>
            <p className="text-body-sm text-on-surface-variant">
              Utiliza patrones de tipo Glob como <code className="font-mono text-primary-fixed-dim bg-surface-container-lowest px-1 rounded">**/*.dll</code> para afectar a archivos en subdirectorios de forma recursiva. Las reglas se evalúan de arriba hacia abajo.
            </p>
          </div>
        </div>
        <div className="p-lg bg-surface-container border border-outline-variant rounded-xl flex gap-md hover:border-secondary-container/30 transition-colors">
          <div className="w-12 h-12 bg-secondary-container/10 rounded-lg flex items-center justify-center shrink-0 border border-secondary-container/20">
            <span className="material-symbols-outlined text-secondary-container">history_edu</span>
          </div>
          <div>
            <h4 className="text-title-md font-bold mb-xs">Registro de Cambios</h4>
            <p className="text-body-sm text-on-surface-variant">
              Las reglas se procesan secuencialmente. El orden determina la prioridad de aplicaci&oacute;n durante el despliegue.
            </p>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Regla' : 'Nueva Regla'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="name" label="Nombre *" placeholder="ej. Ignorar archivos de configuración" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="sourcePattern" label="Patrón Origen *" placeholder="ej. *.config" error={errors.sourcePattern?.message} {...register('sourcePattern')} />
            <Input id="destinationPath" label="Ruta Destino *" placeholder="ej. /backup/config/" error={errors.destinationPath?.message} {...register('destinationPath')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="action"
              label="Acción *"
              error={errors.action?.message}
              {...register('action')}
            >
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </Select>
            <Input id="order" label="Orden *" type="number" placeholder="ej. 1" error={errors.order?.message} {...register('order')} />
          </div>
          <div className="flex justify-end gap-sm border-t border-outline-variant pt-md">
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
