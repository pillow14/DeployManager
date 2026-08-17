import { useState } from 'react'
import Swal from 'sweetalert2'
import { CalendarClock, Plus, XCircle, Eye, Pencil, RotateCw } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { useScheduledDeploys, useScheduledDeploy, useCreateScheduledDeploy, useCancelScheduledDeploy, useUpdateScheduledDeploy } from '@/shared/hooks/useScheduledDeploys'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { usePackages, useUploadPackage } from '@/shared/hooks/usePackages'
import type { ScheduledDeploy } from '@/shared/types/scheduledDeploy'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Executing: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Completed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Cancelled: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const DEFAULT_VALUE = {
  name: '',
  siteId: '',
  packageOption: 'existing' as 'existing' | 'upload',
  uploadFile: null as File | null,
  packageId: '' as string,
  scheduledAt: '',
  recipients: '',
  notifyOnStart: true,
  notifyOnComplete: true,
}

export function ScheduledDeploysPage() {
  const { data: items, isLoading, refetch, isRefetching } = useScheduledDeploys()
  const { data: sites } = useDeploySites()
  const { data: packages } = usePackages()
  const createMutation = useCreateScheduledDeploy()
  const updateMutation = useUpdateScheduledDeploy()
  const cancelMutation = useCancelScheduledDeploy()
  const uploadMutation = useUploadPackage()

  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<ScheduledDeploy | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const [form, setForm] = useState({ ...DEFAULT_VALUE })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const uploadedPackages = (packages || []).filter(p => p.status === 'Uploaded')

  const resetForm = () => {
    setForm({ ...DEFAULT_VALUE })
    setErrors({})
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio.'
    if (!form.siteId) errs.siteId = 'Seleccione un sitio.'
    if (form.packageOption === 'existing' && !form.packageId) errs.packageId = 'Seleccione un paquete.'
    if (form.packageOption === 'upload' && !form.uploadFile) errs.uploadFile = 'Seleccione un archivo ZIP.'
    if (!form.scheduledAt) errs.scheduledAt = 'Seleccione fecha y hora.'
    else if (new Date(form.scheduledAt) <= new Date()) errs.scheduledAt = 'Debe ser una fecha futura.'
    if (!form.recipients.trim()) errs.recipients = 'Al menos un destinatario es requerido.'
    else {
      const emails = form.recipients.split(',').map(e => e.trim()).filter(Boolean)
      if (emails.length === 0) errs.recipients = 'Al menos un destinatario es requerido.'
      else if (emails.some(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) errs.recipients = 'Correo(s) inválido(s).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return

    try {
      let packageId = form.packageOption === 'existing' ? form.packageId : null

      if (form.packageOption === 'upload' && form.uploadFile) {
        const uploaded = await uploadMutation.mutateAsync(form.uploadFile)
        packageId = uploaded.id
      }

      await createMutation.mutateAsync({
        name: form.name.trim(),
        siteId: form.siteId,
        packageId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean),
        notifyOnStart: form.notifyOnStart,
        notifyOnComplete: form.notifyOnComplete,
      })
      await Swal.fire({ icon: 'success', title: 'Despliegue programado', timer: 2000, showConfirmButton: false })
      setCreateOpen(false)
      resetForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear'
      await Swal.fire({ icon: 'error', title: 'Error', text: msg })
    }
  }

  const handleEdit = async () => {
    if (!editItem) return
    if (!validate()) return

    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        request: {
          name: form.name.trim(),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean),
          notifyOnStart: form.notifyOnStart,
          notifyOnComplete: form.notifyOnComplete,
        },
      })
      await Swal.fire({ icon: 'success', title: 'Actualizado', timer: 2000, showConfirmButton: false })
      setEditItem(null)
      resetForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar'
      await Swal.fire({ icon: 'error', title: 'Error', text: msg })
    }
  }

  const handleCancel = async (item: ScheduledDeploy) => {
    const result = await Swal.fire({
      title: '¿Cancelar despliegue?',
      text: `Se cancelará "${item.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    })
    if (!result.isConfirmed) return

    try {
      await cancelMutation.mutateAsync(item.id)
      await Swal.fire({ icon: 'success', title: 'Cancelado', timer: 2000, showConfirmButton: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar'
      await Swal.fire({ icon: 'error', title: 'Error', text: msg })
    }
  }

  const openEdit = (item: ScheduledDeploy) => {
    setEditItem(item)
    setForm({
      name: item.name,
      siteId: item.siteId,
      packageOption: 'existing',
      uploadFile: null,
      packageId: item.packageId || '',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
      recipients: item.recipients.join(', '),
      notifyOnStart: item.notifyOnStart,
      notifyOnComplete: item.notifyOnComplete,
    })
    setErrors({})
  }

  const isPending = (status: string) => status === 'Pending'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despliegues Programados"
        description="Programa despliegues automáticos para una fecha futura"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Refrescar"
            >
              <RotateCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refrescar
            </button>
            <button
              onClick={() => { resetForm(); setCreateOpen(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Cargando despliegues programados..." />
      ) : !items?.length ? (
        <EmptyState
          title="No hay despliegues programados"
          description="Crea un despliegue programado para ejecutarlo automáticamente en el futuro."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sitio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Programado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Creado por</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items!.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.siteName}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status] || ''}`}>
                      {item.status === 'Pending' ? 'Pendiente' :
                       item.status === 'Executing' ? 'Ejecutando' :
                       item.status === 'Completed' ? 'Completado' :
                       item.status === 'Failed' ? 'Fallido' :
                       item.status === 'Cancelled' ? 'Cancelado' : item.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(item.scheduledAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.createdByUserName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setDetailId(item.id)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30" title="Ver detalle">
                        <Eye className="h-4 w-4" />
                      </button>
                      {isPending(item.status) && (
                        <>
                          <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleCancel(item)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" title="Cancelar">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetForm() }} title="Nuevo Despliegue Programado" size="lg">
        <FormContent
          form={form}
          setForm={setForm}
          errors={errors}
          onSubmit={handleCreate}
          onCancel={() => { setCreateOpen(false); resetForm() }}
          sites={sites || []}
          packages={uploadedPackages}
          isSubmitting={createMutation.isPending}
          submitLabel="Programar"
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => { setEditItem(null); resetForm() }} title="Editar Despliegue Programado" size="lg">
        <FormContent
          form={form}
          setForm={setForm}
          errors={errors}
          onSubmit={handleEdit}
          onCancel={() => { setEditItem(null); resetForm() }}
          sites={sites || []}
          packages={uploadedPackages}
          isSubmitting={updateMutation.isPending}
          submitLabel="Guardar"
        />
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detalle de Despliegue Programado" size="lg">
        <DetailContent id={detailId} />
      </Modal>
    </div>
  )
}

function FormContent({
  form, setForm, errors, onSubmit, onCancel, sites, packages: availablePackages, isSubmitting, submitLabel,
}: {
  form: typeof DEFAULT_VALUE
  setForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_VALUE>>
  errors: Record<string, string>
  onSubmit: () => void
  onCancel: () => void
  sites: { id: string; name: string }[]
  packages: { id: string; fileName: string }[]
  isSubmitting: boolean
  submitLabel: string
}) {
  const update = (field: string, value: string | boolean | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const nowLocal = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
        <input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" placeholder="Ej: Deploy v2.1 Producción" />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sitio *</label>
        <select value={form.siteId} onChange={e => { update('siteId', e.target.value); update('packageId', '') }} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
          <option value="">Seleccionar...</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors.siteId && <p className="mt-1 text-xs text-red-500">{errors.siteId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paquete</label>
        <div className="mt-1 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="packageOption" checked={form.packageOption === 'existing'} onChange={() => update('packageOption', 'existing')} className="text-blue-600" />
            Seleccionar existente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="packageOption" checked={form.packageOption === 'upload'} onChange={() => update('packageOption', 'upload')} className="text-blue-600" />
            Subir nuevo
          </label>
        </div>
        {form.packageOption === 'existing' && (
          <select value={form.packageId} onChange={e => update('packageId', e.target.value)} className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <option value="">Seleccionar...</option>
            {availablePackages.map(p => <option key={p.id} value={p.id}>{p.fileName}</option>)}
          </select>
        )}
        {form.packageOption === 'upload' && (
          <input type="file" accept=".zip" onChange={e => update('uploadFile', e.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
        )}
        {errors.packageId && <p className="mt-1 text-xs text-red-500">{errors.packageId}</p>}
        {errors.uploadFile && <p className="mt-1 text-xs text-red-500">{errors.uploadFile}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programado para *</label>
        <input type="datetime-local" value={form.scheduledAt} onChange={e => update('scheduledAt', e.target.value)} min={nowLocal()} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" />
        {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destinatarios (correos separados por coma) *</label>
        <input value={form.recipients} onChange={e => update('recipients', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" placeholder="user1@correo.com, user2@correo.com" />
        {errors.recipients && <p className="mt-1 text-xs text-red-500">{errors.recipients}</p>}
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.notifyOnStart} onChange={e => update('notifyOnStart', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
          Notificar al inicio
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.notifyOnComplete} onChange={e => update('notifyOnComplete', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
          Notificar al completar
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
        <button onClick={onSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <CalendarClock className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </div>
  )
}

function DetailContent({ id }: { id: string | null }) {
  const { data: item, isLoading } = useScheduledDeploy(id || '')

  if (isLoading || !item) return <LoadingState message="Cargando detalle..." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Nombre</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sitio</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.siteName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
          <StatusBadge status={item.status} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Paquete</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.packageFileName || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Programado</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(item.scheduledAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Creado por</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.createdByUserName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Inicio</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(item.startedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Término</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(item.completedAt)}</p>
        </div>
        {item.jobId && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Job ID</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{item.jobId}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Destinatarios</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.recipients?.join(', ') || '-'}</p>
        </div>
      </div>

      {item.errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {item.errorMessage}
        </div>
      )}
    </div>
  )
}
