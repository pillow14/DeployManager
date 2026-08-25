import { cn } from '@/shared/utils/cn'

interface StatusBadgeProps {
  status: string
  dot?: boolean
  className?: string
}

const statusColors: Record<string, string> = {
  active: 'bg-primary-container/10 text-primary-container border border-primary-container',
  inactive: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  success: 'bg-primary-container/10 text-primary-container border border-primary-container',
  completed: 'bg-primary-container/10 text-primary-container border border-primary-container',
  failed: 'bg-error/10 text-error border border-error',
  error: 'bg-error/10 text-error border border-error',
  pending: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  inprogress: 'bg-secondary-container/10 text-secondary-container border border-secondary-container animate-pulse',
  rolledback: 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container',
  executing: 'bg-secondary-container/10 text-secondary-container border border-secondary-container animate-pulse',
  cancelled: 'bg-surface-container-high text-outline border border-outline-variant',
  enabled: 'bg-primary-container/10 text-primary-container border border-primary-container',
  disabled: 'bg-surface-container-high text-outline border border-outline-variant',
}

const dotColors: Record<string, string> = {
  active: 'bg-primary-container shadow-[0_0_8px_rgba(0,255,159,0.8)]',
  inactive: 'bg-outline',
  success: 'bg-primary-container shadow-[0_0_8px_rgba(0,255,159,0.8)]',
  completed: 'bg-primary-container shadow-[0_0_8px_rgba(0,255,159,0.8)]',
  failed: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]',
  error: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]',
  pending: 'bg-outline',
  inprogress: 'bg-secondary-container shadow-[0_0_8px_rgba(0,227,253,0.8)]',
  rolledback: 'bg-tertiary-container',
  executing: 'bg-secondary-container shadow-[0_0_8px_rgba(0,227,253,0.8)]',
  cancelled: 'bg-outline',
  enabled: 'bg-primary-container shadow-[0_0_8px_rgba(0,255,159,0.8)]',
  disabled: 'bg-outline',
}

export function StatusBadge({ status, dot, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '')
  const colorClass = statusColors[normalized] ?? 'bg-surface-container-high text-on-surface-variant border border-outline-variant'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-sm py-1 text-label-code font-medium',
        colorClass,
        className,
      )}
    >
      {dot && <span className={cn('h-2 w-2 rounded-full', dotColors[normalized] ?? 'bg-outline')} />}
      {status}
    </span>
  )
}
