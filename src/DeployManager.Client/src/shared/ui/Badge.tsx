import { cn } from '@/shared/utils/cn'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  dot?: boolean
  children: string
  className?: string
}

const variants = {
  default: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  success: 'bg-primary-container/10 text-primary-container border border-primary-container/30',
  warning: 'bg-secondary-container/10 text-secondary-container border border-secondary-container/30',
  danger: 'bg-error/10 text-error border border-error/30',
  info: 'bg-secondary-container/10 text-secondary-container border border-secondary-container/30',
  purple: 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30',
}

const dotColors = {
  default: 'bg-outline',
  success: 'bg-primary-container',
  warning: 'bg-secondary-container',
  danger: 'bg-error',
  info: 'bg-secondary-container',
  purple: 'bg-tertiary-container',
}

export function Badge({ variant = 'default', dot, children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded px-sm py-1 text-label-code font-bold', variants[variant], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
