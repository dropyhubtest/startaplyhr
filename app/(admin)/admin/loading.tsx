export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade p-2">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl skeleton" />
        <div className="h-80 rounded-2xl skeleton" />
      </div>
    </div>
  )
}
