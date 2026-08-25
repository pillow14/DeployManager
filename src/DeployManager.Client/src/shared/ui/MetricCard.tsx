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

const variantConfig = {
  default: {
    border: 'hover:border-primary-container/50',
    iconBg: 'bg-surface-container-high border border-outline-variant',
    iconText: 'text-on-surface',
    trendColor: 'text-primary-container',
  },
  success: {
    border: 'hover:border-primary-container/50',
    iconBg: 'bg-primary-container/10 border border-primary-container/30',
    iconText: 'text-primary-container',
    trendColor: 'text-primary-container',
  },
  warning: {
    border: 'hover:border-secondary-fixed/50',
    iconBg: 'bg-secondary-fixed/10 border border-secondary-fixed/30',
    iconText: 'text-secondary-fixed',
    trendColor: 'text-secondary-fixed',
  },
  danger: {
    border: 'hover:border-error/50',
    iconBg: 'bg-error/10 border border-error/30',
    iconText: 'text-error',
    trendColor: 'text-error',
  },
}

export function MetricCard({ label, value, icon, trend, variant = 'default', className, onClick }: MetricCardProps) {
  const v = variantConfig[variant]

  return (
    <div
      className={cn(
        'bg-surface-container border border-outline-variant p-lg rounded-xl shadow-sm flex flex-col justify-between transition-all',
        v.border,
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span className="text-body-sm text-on-surface-variant font-medium font-mono">{label}</span>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', v.iconBg, v.iconText)}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-4xl font-bold leading-none mb-xs text-on-surface">{value}</div>
        {trend && (
          <div className={cn('flex items-center gap-xs text-xs font-medium font-mono', v.trendColor)}>
            <span className="material-symbols-outlined text-[16px]">
              {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}
