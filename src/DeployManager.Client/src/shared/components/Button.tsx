import { cn } from '@/shared/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary-container text-on-primary-container font-bold hover:opacity-90 active:scale-95 shadow-[0_0_15px_rgba(0,255,159,0.3)]',
    secondary: 'bg-surface-container-high text-on-surface border border-outline-variant hover:bg-surface-container-highest hover:border-primary-container/50',
    outline: 'border border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-outline',
    ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
    danger: 'bg-error text-on-error font-bold hover:opacity-90',
  }

  const sizes = {
    sm: 'px-sm py-1 text-label-code',
    md: 'px-lg py-sm text-body-sm',
    lg: 'px-lg py-md text-body-lg',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-xs rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      )}
      {children}
    </button>
  )
}
