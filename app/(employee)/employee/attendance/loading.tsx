export default function EmployeeAttendanceLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2 mb-6">
        <div className="h-7 bg-slate-200 rounded w-48" />
        <div className="h-4 bg-slate-200 rounded w-80" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-10 text-center max-w-lg mx-auto space-y-4">
        <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
        <div className="h-12 bg-slate-200 rounded w-64 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-56 mx-auto" />
        <div className="h-14 bg-slate-200 rounded-xl w-44 mx-auto pt-4" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-40" />
          <div className="h-8 bg-slate-200 rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
