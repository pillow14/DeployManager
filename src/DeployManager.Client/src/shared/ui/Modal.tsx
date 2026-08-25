import { useEffect, useRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 p-4 backdrop-blur-md"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={cn('w-full rounded-xl bg-surface-container border border-outline-variant shadow-2xl', sizeClasses[size], className)}>
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md bg-surface-container-high rounded-t-xl">
          <h2 className="text-title-md font-bold text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-lg py-md">{children}</div>
      </div>
    </div>
  )
}
