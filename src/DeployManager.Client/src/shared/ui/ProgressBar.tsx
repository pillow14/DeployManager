import { cn } from '@/shared/utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  variant?: 'blue' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md'
  showValue?: boolean
  className?: string
}

const barColors = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export function ProgressBar({ value, max = 100, label, variant = 'blue', size = 'md', showValue, className }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showValue && <span className="text-gray-500">{pct}%</span>}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-gray-200', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
