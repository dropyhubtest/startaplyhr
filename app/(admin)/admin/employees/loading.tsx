export default function EmployeesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-80" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-36" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white border border-slate-200/70 rounded-xl p-4 flex flex-wrap gap-3 shadow-sm">
        <div className="h-10 bg-slate-100 rounded-lg flex-1 min-w-[200px]" />
        <div className="h-10 bg-slate-100 rounded-lg w-40" />
        <div className="h-10 bg-slate-100 rounded-lg w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-1">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-28" />
            <div className="h-6 bg-slate-200 rounded-full w-16" />
            <div className="h-8 bg-slate-200 rounded-lg w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
