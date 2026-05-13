import { useState } from 'react'
import { Package, Upload, Download, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Table } from '@/shared/ui/Table'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import type { Column } from '@/shared/ui/Table'


interface PackageItem {
  id: string
  name: string
  version: string
  size: string
  uploadedAt: string
  siteName: string
  status: string
}

const mockPackages: PackageItem[] = []

export function PackagesPage() {
  const [uploadOpen, setUploadOpen] = useState(false)

  const handleDelete = async (pkg: PackageItem) => {
    const result = await Swal.fire({
      title: '¿Eliminar paquete?',
      text: `¿Estás seguro de eliminar "${pkg.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (result.isConfirmed) {
      await Swal.fire({ icon: 'success', title: 'Paquete eliminado', timer: 1500, showConfirmButton: false })
    }
  }

  const columns: Column<PackageItem>[] = [
    { key: 'name', header: 'Nombre', cell: (p) => <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span> },
    { key: 'version', header: 'Versión' },
    { key: 'size', header: 'Tamaño' },
    { key: 'siteName', header: 'Sitio' },
    { key: 'status', header: 'Estado', cell: (p) => <StatusBadge status={p.status} dot /> },
    { key: 'uploadedAt', header: 'Subido' },
    {
      key: 'actions', header: 'Acciones', className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400" title="Descargar">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(p)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400" title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paquetes"
        description="Paquetes de despliegue y artefactos de build subidos"
        actions={
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Subir Paquete
          </Button>
        }
      />

      {mockPackages.length === 0 ? (
        <EmptyState
          title="No hay paquetes"
          description="Sube tu primer paquete de despliegue para comenzar."
          action={<Button variant="primary" onClick={() => setUploadOpen(true)}><Upload className="mr-2 h-4 w-4" /> Subir Paquete</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Table columns={columns} data={mockPackages} keyExtractor={(p) => p.id} />
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Subir Paquete" size="md">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 dark:border-gray-600 dark:bg-gray-800">
          <Package className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Suelta tu archivo ZIP aquí</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">o haz clic para buscar</p>
          <Button variant="primary" className="mt-4">
            <Upload className="mr-2 h-4 w-4" /> Seleccionar Archivo
          </Button>
        </div>
      </Modal>
    </div>
  )
}
