import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  border?: boolean
}

export function PageHeader({ title, description, actions, border = true }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${border ? 'border-b border-outline-variant pb-lg mb-lg' : 'mb-xl'}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-headline-lg text-on-surface tracking-tight">{title}</h2>
        {description && <p className="mt-xs text-body-lg text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-sm">{actions}</div>}
    </div>
  )
}
