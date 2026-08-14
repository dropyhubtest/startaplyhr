export default function TasksLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-72" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-5 bg-slate-200 rounded-full w-6" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-white border border-slate-200/70 rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                    <div className="h-4 bg-slate-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
