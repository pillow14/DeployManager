import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-label-code font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-colors resize-y',
            error && 'border-error focus:border-error focus:ring-error/50',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-error font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
