import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  border?: boolean
}

export function PageHeader({ title, description, actions, border = true }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${border ? 'border-b border-gray-200 pb-5 dark:border-gray-700' : ''}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}
