import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, placeholder, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-label-code font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 focus:outline-none transition-colors appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2724%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20fill%3D%27%23849587%27%20d%3D%27M7%2010l5%205%205-5z%27%2F%3E%3C%2Fsvg%3E")] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10',
            error && 'border-error focus:border-error focus:ring-error/50',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        {error && (
          <p id={errorId} className="text-xs text-error font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
