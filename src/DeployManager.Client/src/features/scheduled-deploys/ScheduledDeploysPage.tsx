import { useState } from 'react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Checkbox } from '@/shared/components/Checkbox'
import { useScheduledDeploys, useScheduledDeploy, useCreateScheduledDeploy, useCancelScheduledDeploy, useUpdateScheduledDeploy } from '@/shared/hooks/useScheduledDeploys'
import { useDeploySites } from '@/shared/hooks/useDeploySites'
import { usePackages, useUploadPackage } from '@/shared/hooks/usePackages'
import type { ScheduledDeploy } from '@/shared/types/scheduledDeploy'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const DEFAULT_VALUE = {
  name: '', siteId: '',
  packageOption: 'existing' as 'existing' | 'upload',
  uploadFile: null as File | null,
  packageId: '' as string,
  scheduledAt: '', recipients: '',
  notifyOnStart: true, notifyOnComplete: true,
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
  const resetForm = () => { setForm({ ...DEFAULT_VALUE }); setErrors({}) }

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
      if (form.packageOption === 'upload' && form.uploadFile) { const uploaded = await uploadMutation.mutateAsync(form.uploadFile); packageId = uploaded.id }
      await createMutation.mutateAsync({ name: form.name.trim(), siteId: form.siteId, packageId, scheduledAt: new Date(form.scheduledAt).toISOString(), recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean), notifyOnStart: form.notifyOnStart, notifyOnComplete: form.notifyOnComplete })
      await Swal.fire({ icon: 'success', title: 'Despliegue programado', timer: 2000, showConfirmButton: false })
      setCreateOpen(false); resetForm()
    } catch (err) { const msg = err instanceof Error ? err.message : 'Error al crear'; await Swal.fire({ icon: 'error', title: 'Error', text: msg }) }
  }

  const handleEdit = async () => {
    if (!editItem || !validate()) return
    try {
      await updateMutation.mutateAsync({ id: editItem.id, request: { name: form.name.trim(), scheduledAt: new Date(form.scheduledAt).toISOString(), recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean), notifyOnStart: form.notifyOnStart, notifyOnComplete: form.notifyOnComplete } })
      await Swal.fire({ icon: 'success', title: 'Actualizado', timer: 2000, showConfirmButton: false })
      setEditItem(null); resetForm()
    } catch (err) { const msg = err instanceof Error ? err.message : 'Error al actualizar'; await Swal.fire({ icon: 'error', title: 'Error', text: msg }) }
  }

  const handleCancel = async (item: ScheduledDeploy) => {
    const result = await Swal.fire({ title: '¿Cancelar despliegue?', text: `Se cancelará "${item.name}"`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ffb4ab', cancelButtonColor: '#3a4a3f', confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No' })
    if (!result.isConfirmed) return
    try { await cancelMutation.mutateAsync(item.id); await Swal.fire({ icon: 'success', title: 'Cancelado', timer: 2000, showConfirmButton: false }) }
    catch (err) { const msg = err instanceof Error ? err.message : 'Error al cancelar'; await Swal.fire({ icon: 'error', title: 'Error', text: msg }) }
  }

  const openEdit = (item: ScheduledDeploy) => {
    setEditItem(item)
    setForm({ name: item.name, siteId: item.siteId, packageOption: 'existing', uploadFile: null, packageId: item.packageId || '', scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '', recipients: item.recipients.join(', '), notifyOnStart: item.notifyOnStart, notifyOnComplete: item.notifyOnComplete })
    setErrors({})
  }

  const isPending = (status: string) => status === 'Pending'

  return (
    <div className="space-y-xl">
      <PageHeader title="Despliegues Programados" description="Programa despliegues automáticos para una fecha futura"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              <span className={`material-symbols-outlined text-[18px] ${isRefetching ? 'animate-spin' : ''}`}>refresh</span> Refrescar
            </Button>
            <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
              <span className="material-symbols-outlined text-[18px]">add</span> Nuevo
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Cargando despliegues programados..." />
      ) : !items?.length ? (
        <EmptyState title="No hay despliegues programados" description="Crea un despliegue programado para ejecutarlo automáticamente en el futuro." />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Nombre</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Sitio</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Estado</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Programado</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider">Creado por</th>
                <th className="px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items!.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-highest transition-colors group">
                  <td className="px-lg py-md font-semibold text-on-surface">{item.name}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{item.siteName}</td>
                  <td className="px-lg py-md">
                    <StatusBadge status={item.status === 'Pending' ? 'Pendiente' : item.status === 'Executing' ? 'Executing' : item.status === 'Completed' ? 'Completed' : item.status === 'Failed' ? 'Failed' : item.status === 'Cancelled' ? 'Cancelled' : item.status} />
                  </td>
                  <td className="px-lg py-md font-mono text-body-sm text-outline">{formatDate(item.scheduledAt)}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{item.createdByUserName}</td>
                  <td className="px-lg py-md text-right">
                    <div className="inline-flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailId(item.id)} className="hover:text-primary-fixed-dim transition-colors" title="Ver detalle">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      {isPending(item.status) && (
                        <>
                          <button onClick={() => openEdit(item)} className="hover:text-secondary-container transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleCancel(item)} className="hover:text-error transition-colors" title="Cancelar">
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
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
        <FormContent form={form} setForm={setForm} errors={errors} onSubmit={handleCreate} onCancel={() => { setCreateOpen(false); resetForm() }} sites={sites || []} packages={uploadedPackages} isSubmitting={createMutation.isPending} submitLabel="Programar" />
      </Modal>

      <Modal open={!!editItem} onClose={() => { setEditItem(null); resetForm() }} title="Editar Despliegue Programado" size="lg">
        <FormContent form={form} setForm={setForm} errors={errors} onSubmit={handleEdit} onCancel={() => { setEditItem(null); resetForm() }} sites={sites || []} packages={uploadedPackages} isSubmitting={updateMutation.isPending} submitLabel="Guardar" />
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detalle de Despliegue Programado" size="lg">
        <DetailContent id={detailId} />
      </Modal>
    </div>
  )
}

function FormContent({ form, setForm, errors, onSubmit, onCancel, sites, packages: availablePackages, isSubmitting, submitLabel }: {
  form: typeof DEFAULT_VALUE; setForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_VALUE>>; errors: Record<string, string>
  onSubmit: () => void; onCancel: () => void; sites: { id: string; name: string }[]; packages: { id: string; fileName: string }[]
  isSubmitting: boolean; submitLabel: string
}) {
  const update = (field: string, value: string | boolean | File | null) => setForm(prev => ({ ...prev, [field]: value }))
  const nowLocal = () => { const now = new Date(); const offset = now.getTimezoneOffset(); const local = new Date(now.getTime() - offset * 60000); return local.toISOString().slice(0, 16) }

  return (
    <div className="space-y-4">
      <Input
        label="Nombre *"
        value={form.name}
        onChange={e => update('name', e.target.value)}
        placeholder="Ej: Deploy v2.1 Producción"
        error={errors.name}
      />
      <Select
        label="Sitio *"
        value={form.siteId}
        onChange={e => { update('siteId', e.target.value); update('packageId', '') }}
        placeholder="Seleccionar..."
        error={errors.siteId}
      >
        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <div>
        <label className="block text-label-code font-medium text-on-surface-variant">Paquete</label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
            <input type="radio" name="packageOption" checked={form.packageOption === 'existing'} onChange={() => update('packageOption', 'existing')} className="accent-primary-container" />
            Seleccionar existente
          </label>
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
            <input type="radio" name="packageOption" checked={form.packageOption === 'upload'} onChange={() => update('packageOption', 'upload')} className="accent-primary-container" />
            Subir nuevo
          </label>
        </div>
        {form.packageOption === 'existing' && (
          <div className="mt-2">
            <Select value={form.packageId} onChange={e => update('packageId', e.target.value)} placeholder="Seleccionar paquete..." error={errors.packageId}>
              {availablePackages.map(p => <option key={p.id} value={p.id}>{p.fileName}</option>)}
            </Select>
          </div>
        )}
        {form.packageOption === 'upload' && (
          <div className="mt-2">
            <input type="file" accept=".zip" onChange={e => update('uploadFile', e.target.files?.[0] || null)} className="block w-full text-body-sm text-on-surface-variant file:mr-4 file:rounded-lg file:border-0 file:bg-primary-container/10 file:px-md file:py-2 file:text-body-sm file:font-medium file:text-primary-container file:border file:border-primary-container/30" />
            {errors.uploadFile && <p className="mt-1 text-xs text-error font-medium">{errors.uploadFile}</p>}
          </div>
        )}
      </div>
      <Input
        label="Programado para *"
        type="datetime-local"
        value={form.scheduledAt}
        onChange={e => update('scheduledAt', e.target.value)}
        min={nowLocal()}
        error={errors.scheduledAt}
      />
      <Input
        label="Destinatarios (correos separados por coma) *"
        value={form.recipients}
        onChange={e => update('recipients', e.target.value)}
        placeholder="user1@correo.com, user2@correo.com"
        error={errors.recipients}
      />
      <div className="flex items-center gap-6 pt-1">
        <Checkbox
          id="notify-start"
          label="Notificar al inicio"
          checked={form.notifyOnStart}
          onChange={e => update('notifyOnStart', e.target.checked)}
        />
        <Checkbox
          id="notify-complete"
          label="Notificar al completar"
          checked={form.notifyOnComplete}
          onChange={e => update('notifyOnComplete', e.target.checked)}
        />
      </div>
      <div className="flex justify-end gap-sm pt-2 border-t border-outline-variant">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="button" onClick={onSubmit} isLoading={isSubmitting}>
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </div>
  )
}

function DetailContent({ id }: { id: string | null }) {
  const { data: item, isLoading } = useScheduledDeploy(id || '')
  if (isLoading || !item) return <LoadingState message="Cargando detalle..." />
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-md border border-outline-variant">
        {[['Nombre', item.name], ['Sitio', item.siteName], ['Estado', ''], ['Paquete', item.packageFileName || '-'], ['Programado', formatDate(item.scheduledAt)], ['Creado por', item.createdByUserName], ['Inicio', formatDate(item.startedAt)], ['Término', formatDate(item.completedAt)], ['Destinatarios', item.recipients?.join(', ') || '-']].map(([label, value]) => (
          <div key={label}>
            <p className="text-label-code text-outline">{label}</p>
            {label === 'Estado' ? <StatusBadge status={item.status} /> : <p className="text-body-sm font-medium text-on-surface">{value}</p>}
          </div>
        ))}
        {item.jobId && <div><p className="text-label-code text-outline">Job ID</p><p className="text-body-sm font-mono text-on-surface">{item.jobId}</p></div>}
      </div>
      {item.errorMessage && <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-body-sm text-error">{item.errorMessage}</div>}
    </div>
  )
}
