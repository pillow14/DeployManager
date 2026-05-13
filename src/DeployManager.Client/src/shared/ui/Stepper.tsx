import { cn } from '@/shared/utils/cn'

interface Step {
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  current: number
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < current
        const isCurrent = idx === current
        const isPending = idx > current

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isCompleted && 'bg-blue-600 text-white',
                  isCurrent && 'border-2 border-blue-600 bg-blue-50 text-blue-600',
                  isPending && 'border-2 border-gray-300 bg-white text-gray-400',
                )}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={cn('mt-1.5 text-xs font-medium', isCompleted && 'text-blue-600', isCurrent && 'text-gray-900', isPending && 'text-gray-400')}>
                {step.label}
              </span>
              {step.description && (
                <span className="text-[10px] text-gray-400">{step.description}</span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('mx-3 flex-1 border-t-2', isCompleted ? 'border-blue-600' : 'border-gray-300')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
