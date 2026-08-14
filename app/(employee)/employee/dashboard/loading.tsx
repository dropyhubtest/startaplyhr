export default function EmployeeDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-7 bg-slate-200 rounded w-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-xl p-8 space-y-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-slate-100" />
          <div className="h-10 bg-slate-200 rounded w-48" />
          <div className="h-12 bg-slate-200 rounded-xl w-40" />
        </div>
        <div className="bg-white border border-slate-200/70 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="h-5 bg-slate-200 rounded w-32 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
