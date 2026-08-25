import { useState } from 'react'
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

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file && file.name.toLowerCase().endsWith('.zip')) setSelectedFile(file) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.zip')) { Swal.fire({ icon: 'error', title: 'Formato no válido', text: 'Solo se permiten archivos ZIP.' }); return }
    try {
      await uploadMutation.mutateAsync(selectedFile)
      Swal.fire({ icon: 'success', title: 'Paquete subido', timer: 1500, showConfirmButton: false })
      setUploadOpen(false); setSelectedFile(null)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string }; statusText?: string }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.response?.statusText || axiosErr?.message || 'Error desconocido'
      Swal.fire({ icon: 'error', title: 'Error al subir', text: msg })
    }
  }

  const handleDelete = async (pkg: PackageDto) => {
    const result = await Swal.fire({ title: '¿Eliminar paquete?', text: `¿Estás seguro de eliminar "${pkg.fileName}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' })
    if (result.isConfirmed) { await Swal.fire({ icon: 'success', title: 'Paquete eliminado', timer: 1500, showConfirmButton: false }) }
  }

  const columns: Column<PackageDto>[] = [
    { key: 'fileName', header: 'Nombre', cell: (p) => <span className="font-semibold text-on-surface">{p.fileName}</span> },
    { key: 'fileSize', header: 'Tamaño', cell: (p) => <span className="font-mono">{formatSize(p.fileSize)}</span> },
    { key: 'siteName', header: 'Sitio', cell: (p) => <span>{p.siteName ?? '—'}</span> },
    { key: 'status', header: 'Estado', cell: (p) => <StatusBadge status={p.status} dot /> },
    { key: 'createdAt', header: 'Subido', cell: (p) => <span className="font-mono text-sm">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={p.id ? `/api/packages/${p.id}/download` : '#'} className="hover:text-primary-fixed-dim transition-colors" title="Descargar">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </a>
          <button onClick={() => handleDelete(p)} className="hover:text-error transition-colors" title="Eliminar">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-xl">
      <PageHeader title="Paquetes" description="Paquetes de despliegue y artefactos de build subidos"
        actions={<Button onClick={() => setUploadOpen(true)}><span className="material-symbols-outlined text-[18px]">upload</span> Subir Paquete</Button>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-outline">progress_activity</span>
        </div>
      ) : error ? (
        <EmptyState title="Error al cargar" description="No se pudieron cargar los paquetes." />
      ) : !packages || packages.length === 0 ? (
        <EmptyState title="No hay paquetes" description="Sube tu primer paquete de despliegue para comenzar."
          action={<Button onClick={() => setUploadOpen(true)}><span className="material-symbols-outlined text-[18px]">upload</span> Subir Paquete</Button>}
        />
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <Table columns={columns} data={packages} keyExtractor={(p) => p.id} />
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); setSelectedFile(null) }} title="Subir Paquete" size="md">
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            dragOver
              ? 'border-primary-container bg-primary-container/10'
              : 'border-outline-variant bg-surface-container-lowest hover:border-primary-container/50 hover:bg-surface-container-low'
          }`}
          onClick={() => document.getElementById('package-upload')?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <span className="material-symbols-outlined text-4xl text-outline mb-3">inventory_2</span>
          <p className="text-body-sm font-medium text-on-surface">
            {selectedFile ? selectedFile.name : 'Suelta tu archivo ZIP aquí'}
          </p>
          <p className="mt-1 text-label-code text-outline">o haz clic para buscar</p>
          <input id="package-upload" type="file" accept=".zip" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
        </div>
        {selectedFile && (
          <div className="mt-6 flex justify-end gap-sm border-t border-outline-variant pt-md">
            <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null) }}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              Subir Paquete
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
