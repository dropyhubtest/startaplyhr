export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-7 bg-slate-200 rounded w-64" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-slate-200 rounded-lg w-28" />
          <div className="h-9 bg-slate-200 rounded-lg w-32" />
        </div>
      </div>

      {/* 6 Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200/70 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Team Activity Table Skeleton */}
      <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="h-5 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-48" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200" />
                <div className="space-y-1">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-200 rounded w-20" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded-full w-20" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-4 bg-slate-200 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
