import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Filter, Eye, Edit2, ToggleLeft, Trash2 } from 'lucide-react'

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
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
  })

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
        await Swal.fire({ icon: 'success', title: 'Sitio actualizado', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync({ ...data, publicUrl: data.publicUrl || undefined, username: data.username || undefined, password: data.password || undefined })
        await Swal.fire({ icon: 'success', title: 'Sitio creado', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar el sitio.' })
    }
  }

  const handleToggleActive = async (site: DeploySite) => {
    try {
      await updateMutation.mutateAsync({
        id: site.id,
        data: {
          code: site.code, name: site.name, environmentId: site.environmentId, targetType: site.targetType,
          rootPath: site.rootPath, publicUrl: site.publicUrl ?? undefined, username: site.username ?? undefined,
          id: site.id, isActive: !site.isActive,
        },
      })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar el sitio.' })
    }
  }

  const handleDelete = async (site: DeploySite) => {
    const result = await Swal.fire({
      title: '¿Eliminar sitio?',
      text: `¿Estás seguro de eliminar "${site.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync({ id: site.id })
      await Swal.fire({ icon: 'success', title: 'Sitio eliminado', timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el sitio.'
      await Swal.fire({ icon: 'error', title: 'Error', text: message })
    }
  }

  const columns: Column<DeploySite>[] = [
    { key: 'code', header: 'Código', cell: (s) => <span className="font-medium text-gray-900 dark:text-gray-100">{s.code}</span> },
    { key: 'name', header: 'Nombre' },
    { key: 'environmentName', header: 'Entorno' },
    { key: 'targetType', header: 'Tipo', cell: (s) => <Badge variant="info">{s.targetType}</Badge> },
    { key: 'rootPath', header: 'Ruta Raíz', className: 'max-w-[180px] truncate' },
    { key: 'publicUrl', header: 'URL', cell: (s) => s.publicUrl ? <span className="text-blue-600 dark:text-blue-400">{s.publicUrl}</span> : <span className="text-gray-400 dark:text-gray-500">&mdash;</span> },
    { key: 'isActive', header: 'Estado', cell: (s) => <StatusBadge status={s.isActive ? 'Activo' : 'Inactivo'} dot /> },
    {
      key: 'actions', header: 'Acciones', className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setViewing(s); setDetailOpen(true) }} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Ver detalles">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400" title="Editar">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleToggleActive(s)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-orange-600 dark:hover:bg-gray-800 dark:hover:text-orange-400" title={s.isActive ? 'Desactivar' : 'Activar'}>
            <ToggleLeft className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(s)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400" title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingState message="Cargando sitios de despliegue..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sitios de Despliegue"
        description="Gestiona tus servidores y ubicaciones de despliegue"
        actions={
          <Button onClick={openCreate} variant="primary">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Sitio
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFilters((f) => ({ ...f, search: searchInput || undefined }))
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <select
          value={filters.environmentId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, environmentId: e.target.value || undefined }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filtrar por entorno"
        >
          <option value="">Todos los entornos</option>
          {environments?.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
        </select>
        <select
          value={filters.targetType ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value || undefined }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {filteredSites.length === 0 ? (
        <EmptyState
          title="No hay sitios de despliegue"
          description="Crea tu primer sitio de despliegue para comenzar."
          action={<Button onClick={openCreate} variant="primary"><Plus className="mr-2 h-4 w-4" /> Agregar Sitio</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
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
            <div className="space-y-1">
              <label htmlFor="environmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Entorno *</label>
              <select id="environmentId" className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" {...register('environmentId')}>
                <option value="">Seleccionar...</option>
                {environments?.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
              </select>
              {errors.environmentId && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errors.environmentId.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo Destino *</label>
              <select id="targetType" className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" {...register('targetType')}>
                {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.targetType && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errors.targetType.message}</p>}
            </div>
          </div>
          <Input id="rootPath" label="Ruta Raíz *" placeholder="ej. C:\inetpub\wwwroot\miapp" error={errors.rootPath?.message} {...register('rootPath')} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="publicUrl" label="URL Pública" placeholder="https://miapp.ejemplo.cl" error={errors.publicUrl?.message} {...register('publicUrl')} />
            <Input id="username" label="Usuario Conexión" placeholder="dominio\usuario" error={errors.username?.message} {...register('username')} />
          </div>
          <Input id="password" label={editing ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña de Conexión'} type="password" placeholder="Ingrese contraseña" error={errors.password?.message} {...register('password')} />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Actualizar Sitio' : 'Crear Sitio'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalles del Sitio" size="md">
        {viewing && (
          <dl className="divide-y divide-gray-100 dark:divide-gray-700">
            {([['Código', viewing.code], ['Nombre', viewing.name], ['Entorno', viewing.environmentName], ['Tipo Destino', viewing.targetType], ['Ruta Raíz', viewing.rootPath], ['URL Pública', viewing.publicUrl ?? '—'], ['Usuario', viewing.username ?? '—'], ['Estado', viewing.isActive ? 'Activo' : 'Inactivo'], ['Creado', new Date(viewing.createdAt).toLocaleString()]] as const).map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="font-medium text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-gray-900 dark:text-gray-100">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  )
}
