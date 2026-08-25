import { cn } from '@/shared/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded bg-surface-container-high', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface-container border border-outline-variant p-lg rounded-xl shadow-sm">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="border-b border-outline-variant bg-surface-container-high p-lg">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-outline-variant px-lg py-md last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}
