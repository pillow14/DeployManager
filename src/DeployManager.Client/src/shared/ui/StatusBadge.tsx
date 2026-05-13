import { cn } from '@/shared/utils/cn'

interface StatusBadgeProps {
  status: string
  dot?: boolean
  className?: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  inactive: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  success: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  completed: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  failed: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  error: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  inprogress: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  rolledback: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  enabled: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  disabled: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

const dotColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  success: 'bg-green-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  error: 'bg-red-500',
  pending: 'bg-yellow-500',
  inprogress: 'bg-blue-500',
  rolledback: 'bg-purple-500',
  enabled: 'bg-green-500',
  disabled: 'bg-gray-400',
}

export function StatusBadge({ status, dot, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '')
  const colorClass = statusColors[normalized] ?? 'bg-gray-50 text-gray-700 border border-gray-200'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[normalized] ?? 'bg-gray-400')} />}
      {status}
    </span>
  )
}
