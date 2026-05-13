import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
  className?: string
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {trend && (
        <p
          className={cn(
            'mt-1 text-sm',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600',
          )}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
