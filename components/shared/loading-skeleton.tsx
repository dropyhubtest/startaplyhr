import { cn } from "@/lib/utils"

export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-md", className)} />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div className="space-y-3">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-8 w-16" />
        <SkeletonBox className="h-3 w-32" />
      </div>
      <SkeletonBox className="h-12 w-12 rounded-xl" />
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 border-b border-gray-50 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-48" />
          <SkeletonBox className="h-4 w-64" />
        </div>
      </div>
      <StatCardsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <SkeletonBox className="h-16 w-full" />
          <SkeletonBox className="h-16 w-full" />
          <SkeletonBox className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonBox className="h-4 w-1/2" />
      <div className="pt-4 space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
      <SkeletonBox className="h-24 w-24 rounded-full" />
      <SkeletonBox className="h-6 w-40" />
      <SkeletonBox className="h-4 w-24" />
      <div className="w-full pt-4 space-y-3">
        <SkeletonBox className="h-10 w-full rounded-md" />
        <SkeletonBox className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-10 w-full rounded-md" />
        </div>
      ))}
      <SkeletonBox className="h-10 w-32 rounded-md mt-6" />
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div key={colIdx} className="bg-gray-50 rounded-xl p-4 space-y-4 min-h-[500px]">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ))}
    </div>
  )
}
