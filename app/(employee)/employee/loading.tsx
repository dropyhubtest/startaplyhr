export default function EmployeeLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade p-2">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
        <div className="h-96 rounded-2xl skeleton" />
      </div>
    </div>
  )
}
