import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant">
        <span className="material-symbols-outlined text-3xl text-outline">inbox</span>
      </div>
      <h3 className="text-title-md font-bold text-on-surface">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
