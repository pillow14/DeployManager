import { useState } from 'react'
import { Package, Upload, Download, Trash2, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { usePackages, useUploadPackage } from '@/shared/hooks/usePackages'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Table } from '@/shared/ui/Table'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import type { Column } from '@/shared/ui/Table'
import type { PackageDto } from '@/shared/types/package'

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  if (bytes >= 1_024) return (bytes / 1_024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function PackagesPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const { data: packages, isLoading, error } = usePackages()
  const uploadMutation = useUploadPackage()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      Swal.fire({ icon: 'error', title: 'Formato no válido', text: 'Solo se permiten archivos ZIP.' })
      return
    }
    try {
      await uploadMutation.mutateAsync(selectedFile)
      Swal.fire({ icon: 'success', title: 'Paquete subido', timer: 1500, showConfirmButton: false })
      setUploadOpen(false)
      setSelectedFile(null)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string }; statusText?: string }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.response?.statusText || axiosErr?.message || 'Error desconocido'
      Swal.fire({ icon: 'error', title: 'Error al subir', text: msg })
    }
  }

  const handleDelete = async (pkg: PackageDto) => {
    const result = await Swal.fire({
      title: '¿Eliminar paquete?',
      text: `¿Estás seguro de eliminar "${pkg.fileName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (result.isConfirmed) {
      await Swal.fire({ icon: 'success', title: 'Paquete eliminado', timer: 1500, showConfirmButton: false })
    }
  }

  const columns: Column<PackageDto>[] = [
    { key: 'fileName', header: 'Nombre', cell: (p) => <span className="font-medium text-gray-900 dark:text-gray-100">{p.fileName}</span> },
    { key: 'fileSize', header: 'Tamaño', cell: (p) => <span>{formatSize(p.fileSize)}</span> },
    { key: 'siteName', header: 'Sitio', cell: (p) => <span>{p.siteName ?? '—'}</span> },
    { key: 'status', header: 'Estado', cell: (p) => <StatusBadge status={p.status} dot /> },
    { key: 'createdAt', header: 'Subido', cell: (p) => <span>{formatDate(p.createdAt)}</span> },
    {
      key: 'actions', header: 'Acciones', className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={p.id ? `/api/packages/${p.id}/download` : '#'}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </a>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <EmptyState title="Error al cargar" description="No se pudieron cargar los paquetes." />
      ) : !packages || packages.length === 0 ? (
        <EmptyState
          title="No hay paquetes"
          description="Sube tu primer paquete de despliegue para comenzar."
          action={<Button variant="primary" onClick={() => setUploadOpen(true)}><Upload className="mr-2 h-4 w-4" /> Subir Paquete</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Table columns={columns} data={packages} keyExtractor={(p) => p.id} />
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); setSelectedFile(null) }} title="Subir Paquete" size="md">
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'
          }`}
          onClick={() => document.getElementById('package-upload')?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Package className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedFile ? selectedFile.name : 'Suelta tu archivo ZIP aquí'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">o haz clic para buscar</p>
          <input
            id="package-upload"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {selectedFile && (
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null) }}>Cancelar</Button>
            <Button variant="primary" onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Subir Paquete
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
