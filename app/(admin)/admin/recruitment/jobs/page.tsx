"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateJobModal } from "@/components/admin/recruitment/create-job-modal"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { toast } from "sonner"
import { 
  Plus, Search, Briefcase, UserPlus, Clock, CheckCircle2, 
  AlertCircle, Eye, Pencil, XCircle, ArrowUpRight, UserCheck, Filter, ExternalLink
} from "lucide-react"
import { cn, getInitials, formatDate } from "@/lib/utils"

import { ConfirmModal } from "@/components/ui-v2/confirm-modal"

export default function AdminJobsPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assignedFilter, setAssignedFilter] = useState("all")

  // Assign Modal Quick State
  const [assigningJob, setAssigningJob] = useState<any>(null)
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("")
  const [assigning, setAssigning] = useState(false)

  // Confirm Close State
  const [closingJobId, setClosingJobId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  // Fetch Jobs with React Query
  const { data: jobsQueryData, isLoading: loading } = useQuery({
    queryKey: ["jobs", { status: statusFilter, priority: priorityFilter, assignedTo: assignedFilter, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        assignedTo: assignedFilter,
        search,
        limit: "100",
      })
      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error("Failed to load jobs")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch Recruiters for Quick Assign
  const { data: recruitersData } = useQuery({
    queryKey: ["recruiters"],
    queryFn: async () => {
      const res = await fetch("/api/employees?limit=100")
      if (!res.ok) throw new Error("Failed to load recruiters")
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  const jobs: any[] = jobsQueryData?.jobs || []
  const recruiters: any[] = recruitersData?.employees || []

  // Calculate Stat Cards
  const totalOpen = jobs.filter((j) => j.status === "OPEN" || j.status === "IN_PROGRESS").length
  const unassignedCount = jobs.filter((j) => !j.assignedToId && j.status !== "CLOSED" && j.status !== "CANCELLED").length
  const inProgressCount = jobs.filter((j) => j.status === "IN_PROGRESS").length
  const closingSoonCount = jobs.filter((j) => {
    if (!j.deadline || j.status === "CLOSED" || j.status === "CANCELLED") return false
    const daysLeft = differenceInDays(new Date(j.deadline), new Date())
    return daysLeft >= 0 && daysLeft <= 7
  }).length

  const handleQuickAssign = async () => {
    if (!assigningJob || !selectedRecruiterId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/jobs/${assigningJob.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiterId }),
      })
      if (res.ok) {
        toast.success(`Job assigned successfully!`)
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setAssigningJob(null)
        setSelectedRecruiterId("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to assign")
      }
    } catch (e) {
      toast.error("Failed to assign recruiter")
    } finally {
      setAssigning(false)
    }
  }

  const handleConfirmCloseJob = async () => {
    if (!closingJobId) return
    setClosing(true)
    try {
      const res = await fetch(`/api/jobs/${closingJobId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        toast.success("Job marked as CLOSED")
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setClosingJobId(null)
      } else {
        toast.error("Failed to close job")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="Job Descriptions & Recruitment"
        description="Create JDs, assign to recruiters, and track fulfillment progress"
        action={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4 shadow-md hover:shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Job Description
          </Button>
        }
      />

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Jobs</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalOpen}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Unassigned (Needs Action)</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{unassignedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{inProgressCount}</p>
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

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search job title, client, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="w-36 h-10 text-xs font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">🔵 Open</SelectItem>
              <SelectItem value="IN_PROGRESS">🟠 In Progress</SelectItem>
              <SelectItem value="ON_HOLD">⚪ On Hold</SelectItem>
              <SelectItem value="CLOSED">🟢 Closed</SelectItem>
              <SelectItem value="CANCELLED">🔴 Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
            <SelectTrigger className="w-36 h-10 text-xs font-medium">
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

          <Select value={assignedFilter} onValueChange={(val) => val && setAssignedFilter(val)}>
            <SelectTrigger className="w-40 h-10 text-xs font-medium">
              <SelectValue placeholder="All Assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recruiters</SelectItem>
              <SelectItem value="unassigned">⚠️ Unassigned</SelectItem>
              {recruiters.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* JOBS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            Loading job descriptions...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Job Descriptions Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No recruitment jobs match your current search filters. Create a new job description to get started.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs mt-2"
            >
              + Create First Job
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Job Info</th>
                  <th className="px-4 py-4">Priority</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Assigned To</th>
                  <th className="px-4 py-4">Deadline</th>
                  <th className="px-4 py-4">Fulfillment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jobs.map((job) => {
                  const daysRemaining = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null
                  const isUrgentDeadline = daysRemaining !== null && daysRemaining <= 3 && job.status !== "CLOSED"

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Job Title + ID */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                              {job.jobId}
                            </span>
                            <Link
                              href={`/admin/recruitment/jobs/${job.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                            >
                              {job.title}
                            </Link>
                          </div>
                          {job.clientName && (
                            <p className="text-[11px] text-slate-400 font-medium">Client: {job.clientName}</p>
                          )}
                          <p className="text-[11px] text-slate-400 truncate">{job.location || "Location unstated"} • {job.workType}</p>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider",
                          job.priority === "URGENT" && "bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse",
                          job.priority === "HIGH" && "bg-amber-50 text-amber-700 border-amber-200",
                          job.priority === "MEDIUM" && "bg-blue-50 text-blue-700 border-blue-200",
                          job.priority === "LOW" && "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {job.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider",
                          job.status === "OPEN" && "bg-blue-50 text-blue-700 border-blue-200",
                          job.status === "IN_PROGRESS" && "bg-amber-50 text-amber-700 border-amber-200",
                          job.status === "ON_HOLD" && "bg-slate-100 text-slate-600 border-slate-200",
                          job.status === "CLOSED" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          job.status === "CANCELLED" && "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {job.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-4">
                        {job.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {getInitials(job.assignedTo.name)}
                            </div>
                            <span className="font-bold text-slate-800">{job.assignedTo.name}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningJob(job)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold hover:bg-amber-100 transition-all"
                          >
                            <UserPlus className="w-3 h-3 text-amber-600" />
                            + Assign Now
                          </button>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-4">
                        {job.deadline ? (
                          <div className="space-y-0.5">
                            <p className={cn(
                              "text-xs font-bold",
                              isUrgentDeadline ? "text-rose-600" : "text-slate-700"
                            )}>
                              {formatDate(job.deadline)}
                            </p>
                            {daysRemaining !== null && (
                              <p className={cn(
                                "text-[10px] font-semibold",
                                daysRemaining < 0 ? "text-rose-600 font-bold" : daysRemaining <= 3 ? "text-rose-600" : "text-slate-400"
                              )}>
                                {daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)}d` : `${daysRemaining} days left`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>

                      {/* Positions Progress */}
                      <td className="px-4 py-4 min-w-[130px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-700">{job.positionsFilled} / {job.positionsToFill} Filled</span>
                            <span className="text-slate-400">{Math.round((job.positionsFilled / Math.max(1, job.positionsToFill)) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                job.positionsFilled >= job.positionsToFill ? "bg-emerald-500" : "bg-indigo-600"
                              )}
                              style={{ width: `${Math.min(100, (job.positionsFilled / Math.max(1, job.positionsToFill)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/recruitment/jobs/${job.id}`}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                            title="View Job Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {job.status !== "CLOSED" && (
                            <button
                              onClick={() => setClosingJobId(job.id)}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
                              title="Mark as Closed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE JOB MODAL */}
      <CreateJobModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["jobs"] })}
      />

      {/* QUICK ASSIGN MODAL */}
      {assigningJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Assign Job to Recruiter</h3>
            <p className="text-xs text-slate-500">
              Select an employee to handle recruitment for <span className="font-bold text-slate-800">{assigningJob.title}</span> ({assigningJob.jobId}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Recruiter</label>
              <Select value={selectedRecruiterId} onValueChange={(val) => val && setSelectedRecruiterId(val)}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Choose recruiter..." />
                </SelectTrigger>
                <SelectContent>
                  {recruiters.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      👤 {r.name} ({r.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssigningJob(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleQuickAssign}
                disabled={assigning || !selectedRecruiterId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM CLOSE JOB MODAL */}
      <ConfirmModal
        open={Boolean(closingJobId)}
        onClose={() => setClosingJobId(null)}
        onConfirm={handleConfirmCloseJob}
        title="Close Job Description?"
        description="Are you sure you want to mark this job description as CLOSED?"
        confirmText="Close Job"
        variant="warning"
        loading={closing}
      />
    </div>
  )
}
