import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Select } from '@/shared/components/Select'
import { useDeploySites, useCreateDeploySite, useUpdateDeploySite, useDeleteDeploySite } from '@/shared/hooks/useDeploySites'
import { useEnvironments } from '@/shared/hooks/useEnvironments'
import type { DeploySite } from '@/shared/types/deploySite'
import type { Column } from '@/shared/ui/Table'

const TARGET_TYPES = ['IIS', 'AzureAppService', 'FTPS', 'UNC'] as const

const siteSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  environmentId: z.string().min(1, 'El entorno es obligatorio'),
  targetType: z.string().min(1, 'El tipo de destino es obligatorio'),
  rootPath: z.string().min(1, 'La ruta raíz es obligatoria'),
  publicUrl: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

type SiteForm = z.infer<typeof siteSchema>

export function SitesPage() {
  const [filters, setFilters] = useState<{ environmentId?: string; targetType?: string; status?: string; search?: string }>({})
  const [searchInput, setSearchInput] = useState('')
  const { data: sites, isLoading } = useDeploySites({ ...filters, includeInactive: true })
  const { data: environments } = useEnvironments()
  const createMutation = useCreateDeploySite()
  const updateMutation = useUpdateDeploySite()
  const deleteMutation = useDeleteDeploySite()

  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<DeploySite | null>(null)
  const [viewing, setViewing] = useState<DeploySite | null>(null)

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<SiteForm>({ resolver: zodResolver(siteSchema) })

  const filteredSites = sites?.filter((s) => {
    if (filters.status === 'active' && !s.isActive) return false
    if (filters.status === 'inactive' && s.isActive) return false
    if (filters.targetType && s.targetType !== filters.targetType) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false
    }
    return true
  }) ?? []

  const openCreate = () => { setEditing(null); reset({ code: '', name: '', environmentId: '', targetType: 'IIS', rootPath: '', publicUrl: '', username: '', password: '' }); setModalOpen(true) }
  const openEdit = (site: DeploySite) => { setEditing(site); reset({ code: site.code, name: site.name, environmentId: site.environmentId, targetType: site.targetType, rootPath: site.rootPath, publicUrl: site.publicUrl ?? '', username: site.username ?? '', password: '' }); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = async (data: SiteForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: { ...data, publicUrl: data.publicUrl || undefined, username: data.username || undefined, password: data.password || undefined, id: editing.id, isActive: editing.isActive } })
        await Swal.fire({ icon: 'success', title: 'Sitio actualizado', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync({ ...data, publicUrl: data.publicUrl || undefined, username: data.username || undefined, password: data.password || undefined })
        await Swal.fire({ icon: 'success', title: 'Sitio creado', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch { await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar el sitio.' }) }
  }

  const handleToggleActive = async (site: DeploySite) => {
    try { await updateMutation.mutateAsync({ id: site.id, data: { code: site.code, name: site.name, environmentId: site.environmentId, targetType: site.targetType, rootPath: site.rootPath, publicUrl: site.publicUrl ?? undefined, username: site.username ?? undefined, id: site.id, isActive: !site.isActive } }) }
    catch { await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar el sitio.' }) }
  }

  const handleDelete = async (site: DeploySite) => {
    const result = await Swal.fire({ title: '¿Eliminar sitio?', text: `¿Estás seguro de eliminar "${site.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' })
    if (!result.isConfirmed) return
    try { await deleteMutation.mutateAsync({ id: site.id }); await Swal.fire({ icon: 'success', title: 'Sitio eliminado', timer: 1500, showConfirmButton: false }) }
    catch (err: unknown) { const message = err instanceof Error ? err.message : 'Error al eliminar el sitio.'; await Swal.fire({ icon: 'error', title: 'Error', text: message }) }
  }

  const columns: Column<DeploySite>[] = [
    { key: 'code', header: 'Código', cell: (s) => <span className="font-mono text-primary-container font-medium">{s.code}</span> },
    { key: 'name', header: 'Nombre', cell: (s) => <span className="font-semibold text-on-surface">{s.name}</span> },
    { key: 'environmentName', header: 'Entorno' },
    { key: 'targetType', header: 'Tipo', cell: (s) => <Badge variant="info">{s.targetType}</Badge> },
    { key: 'rootPath', header: 'Ruta Raíz', className: 'max-w-[180px] truncate', cell: (s) => <span className="font-mono text-sm">{s.rootPath}</span> },
    { key: 'publicUrl', header: 'URL', cell: (s) => s.publicUrl ? <span className="text-primary-container">{s.publicUrl}</span> : <span className="text-outline">&mdash;</span> },
    { key: 'isActive', header: 'Estado', cell: (s) => <StatusBadge status={s.isActive ? 'Activo' : 'Inactivo'} dot /> },
    {
      key: 'actions', header: '', className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setViewing(s); setDetailOpen(true) }} className="hover:text-primary-fixed-dim transition-colors" title="Ver detalles">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
          <button onClick={() => openEdit(s)} className="hover:text-primary-fixed-dim transition-colors" title="Editar">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button onClick={() => handleToggleActive(s)} className="hover:text-amber-400 transition-colors" title={s.isActive ? 'Desactivar' : 'Activar'}>
            <span className="material-symbols-outlined text-[20px]">toggle_on</span>
          </button>
          <button onClick={() => handleDelete(s)} className="hover:text-error transition-colors" title="Eliminar">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingState message="Cargando sitios de despliegue..." />

  return (
    <div className="space-y-xl">
      <PageHeader title="Sitios de Despliegue" description="Gestiona tus servidores y ubicaciones de despliegue"
        actions={<Button onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span> Nuevo Sitio</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input type="text" placeholder="Buscar por nombre o código..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setFilters((f) => ({ ...f, search: searchInput || undefined })) }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 focus:outline-none transition-colors"
          />
        </div>
        <Select value={filters.environmentId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, environmentId: e.target.value || undefined }))} placeholder="Todos los entornos">
          {environments?.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
        </Select>
        <Select value={filters.targetType ?? ''} onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value || undefined }))} placeholder="Todos los tipos">
          {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))} placeholder="Todos los estados">
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </Select>
      </div>

      {filteredSites.length === 0 ? (
        <EmptyState title="No hay sitios de despliegue" description="Crea tu primer sitio de despliegue para comenzar."
          action={<Button onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span> Agregar Sitio</Button>}
        />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <Table columns={columns} data={filteredSites} keyExtractor={(s) => s.id} />
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Sitio' : 'Nuevo Sitio'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="code" label="Código *" placeholder="ej. PROD-WEB-01" error={errors.code?.message} {...register('code')} />
            <Input id="name" label="Nombre *" placeholder="ej. Servidor Web Producción" error={errors.name?.message} {...register('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select id="environmentId" label="Entorno *" error={errors.environmentId?.message} placeholder="Seleccionar..." {...register('environmentId')}>
              {environments?.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
            </Select>
            <Select id="targetType" label="Tipo Destino *" error={errors.targetType?.message} {...register('targetType')}>
              {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input id="rootPath" label="Ruta Raíz *" placeholder="ej. C:\inetpub\wwwroot\miapp" error={errors.rootPath?.message} {...register('rootPath')} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="publicUrl" label="URL Pública" placeholder="https://miapp.ejemplo.cl" error={errors.publicUrl?.message} {...register('publicUrl')} />
            <Input id="username" label="Usuario Conexión" placeholder="dominio\usuario" error={errors.username?.message} {...register('username')} />
          </div>
          <Input id="password" label={editing ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña de Conexión'} type="password" placeholder="Ingrese contraseña" error={errors.password?.message} {...register('password')} />
          <div className="flex justify-end gap-sm border-t border-outline-variant pt-md">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Actualizar Sitio' : 'Crear Sitio'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalles del Sitio" size="md">
        {viewing && (
          <dl className="divide-y divide-outline-variant">
            {([['Código', viewing.code], ['Nombre', viewing.name], ['Entorno', viewing.environmentName], ['Tipo Destino', viewing.targetType], ['Ruta Raíz', viewing.rootPath], ['URL Pública', viewing.publicUrl ?? '—'], ['Usuario', viewing.username ?? '—'], ['Estado', viewing.isActive ? 'Activo' : 'Inactivo'], ['Creado', new Date(viewing.createdAt).toLocaleString()]] as const).map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="font-medium text-outline">{label}</dt>
                <dd className="text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  )
}
