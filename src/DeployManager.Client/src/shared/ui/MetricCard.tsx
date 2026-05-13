import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
  onClick?: () => void
}

const variantBorders = {
  default: 'border-gray-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  danger: 'border-red-200',
}

const variantAccents = {
  default: 'bg-blue-50 text-blue-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-yellow-50 text-yellow-600',
  danger: 'bg-red-50 text-red-600',
}

export function MetricCard({ label, value, icon, trend, variant = 'default', className, onClick }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900',
        variantBorders[variant],
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', variantAccents[variant])}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {trend && (
        <p className={cn('mt-1 text-sm', trend.direction === 'up' ? 'text-green-600' : 'text-red-600')}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
