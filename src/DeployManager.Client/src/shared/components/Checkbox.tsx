import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined

    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-3 cursor-pointer group',
            className,
          )}
        >
          <span className="relative flex items-center justify-center">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              className="peer sr-only"
              aria-invalid={!!error}
              aria-describedby={errorId}
              {...props}
            />
            <span className="dm-checkbox-box">
              <svg
                className="h-3 w-3 text-on-primary-container"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </span>
          <span className="text-body-sm text-on-surface-variant select-none">{label}</span>
        </label>
        {error && (
          <p id={errorId} className="text-xs text-error font-medium ml-[30px]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
