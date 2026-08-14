"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { differenceInDays } from "date-fns"
import { 
  Briefcase, Clock, CheckCircle2, AlertCircle, ArrowUpRight, 
  MapPin, DollarSign, Target, UserCheck, Eye, Sparkles
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

export default function EmployeeMyJobsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Fetch Assigned Jobs
  const { data: jobsQueryData, isLoading: loading } = useQuery({
    queryKey: ["my-jobs", { status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        limit: "100",
      })
      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error("Failed to load assigned jobs")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const jobs: any[] = jobsQueryData?.jobs || []

  // Stats calculation
  const totalAssigned = jobs.length
  const activeCount = jobs.filter((j) => j.status === "IN_PROGRESS" || j.status === "OPEN").length
  const closingSoonCount = jobs.filter((j) => {
    if (!j.deadline || j.status === "CLOSED" || j.status === "CANCELLED") return false
    const daysLeft = differenceInDays(new Date(j.deadline), new Date())
    return daysLeft >= 0 && daysLeft <= 7
  }).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="My Assigned Recruitment Jobs"
        description="View job descriptions assigned to you and log recruitment work updates"
      />

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assigned JDs</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalAssigned}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active (In Progress)</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Closing Soon (&lt; 7 Days)</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{closingSoonCount}</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Assigned JDs</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">🔵 Open</SelectItem>
              <SelectItem value="IN_PROGRESS">🟠 In Progress</SelectItem>
              <SelectItem value="ON_HOLD">⚪ On Hold</SelectItem>
              <SelectItem value="CLOSED">🟢 Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="URGENT">🔴 Urgent</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="MEDIUM">🔵 Medium</SelectItem>
              <SelectItem value="LOW">⚪ Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* JOBS CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-medium">
          Loading assigned jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200/70 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Assigned Jobs</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You currently have no recruitment job descriptions assigned to you. When HR assigns a job, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => {
            const daysRemaining = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null
            const isUrgent = job.priority === "URGENT" || (daysRemaining !== null && daysRemaining <= 3 && job.status !== "CLOSED")

            return (
              <div
                key={job.id}
                className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5.5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/80 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between space-y-4 group overflow-hidden"
              >
                {/* Top Accent Bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:h-[4px]",
                    job.priority === "URGENT" && "from-rose-500 via-pink-500 to-rose-600",
                    job.priority === "HIGH" && "from-amber-500 via-orange-500 to-amber-600",
                    job.priority === "MEDIUM" && "from-indigo-500 via-blue-500 to-indigo-600",
                    job.priority === "LOW" && "from-slate-400 via-slate-500 to-slate-600"
                  )}
                />

                {/* Header info */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider shadow-2xs",
                      job.priority === "URGENT" && "bg-rose-50 text-rose-700 border-rose-200",
                      job.priority === "HIGH" && "bg-amber-50 text-amber-700 border-amber-200",
                      job.priority === "MEDIUM" && "bg-blue-50 text-blue-700 border-blue-200",
                      job.priority === "LOW" && "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {job.priority}
                    </span>

                    <span className="font-mono text-xs font-bold bg-slate-100/90 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                      {job.jobId}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    {job.clientName && (
                      <p className="text-[12px] text-indigo-600 font-bold mt-0.5">Client: {job.clientName}</p>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 pt-1">
                    <span className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                      📍 {job.location || "N/A"}
                    </span>
                    <span className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                      💼 {job.workType}
                    </span>
                    {job.salaryRange && (
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold">
                        💰 {job.salaryRange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Progress & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700">Positions Filled</span>
                      <span className="text-indigo-600 font-mono">{job.positionsFilled} / {job.positionsToFill}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 shadow-2xs",
                          job.positionsFilled >= job.positionsToFill 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                            : "bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"
                        )}
                        style={{ width: `${Math.min(100, (job.positionsFilled / Math.max(1, job.positionsToFill)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {job.deadline && (
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-0.5">
                      <span>Deadline:</span>
                      <span className={cn("font-bold font-mono", isUrgent ? "text-rose-600" : "text-slate-700")}>
                        {formatDate(job.deadline)} ({daysRemaining !== null ? `${daysRemaining}d left` : ""})
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/employee/recruitment/jobs/${job.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    View JD & Log Update
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
