export default function LeavesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-44" />
          <div className="h-4 bg-slate-200 rounded w-80" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-36" />
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex gap-4 border-b border-slate-100 pb-3">
          <div className="h-8 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-24" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-1">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-20" />
              </div>
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-24" />
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-8 bg-slate-200 rounded-lg w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
