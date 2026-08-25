import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => ReactNode
  className?: string
  sortable?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
}

export function Table<T>({ columns, data, keyExtractor, onRowClick, emptyMessage = 'No data', className }: TableProps<T>) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-12 text-body-sm text-outline">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-high border-b border-outline-variant">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-lg py-md text-label-code font-semibold text-outline uppercase tracking-wider',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'transition-colors group',
                onRowClick && 'cursor-pointer hover:bg-surface-container-highest',
                !onRowClick && 'hover:bg-surface-container-low',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-lg py-md text-body-sm text-on-surface-variant', col.className)}
                >
                  {col.cell ? col.cell(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
