export default function ReportsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-80" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-36" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200/70 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded w-40" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
            <div className="h-9 bg-slate-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
