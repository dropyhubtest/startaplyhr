export default function AttendanceLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded w-52" />
          <div className="h-4 bg-slate-200 rounded w-72" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-32" />
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl p-6 shadow-sm space-y-4">
        <div className="h-10 bg-slate-100 rounded-lg w-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-20" />
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
