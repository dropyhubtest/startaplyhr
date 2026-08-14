"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { 
  ArrowLeft, Briefcase, UserPlus, Clock, CheckCircle2, MessageSquarePlus, 
  ExternalLink, Calendar, MapPin, DollarSign, Building2, Tag, Loader2, Shield, User, X
} from "lucide-react"
import { cn, getInitials, formatDate } from "@/lib/utils"

import { ConfirmModal } from "@/components/ui-v2/confirm-modal"

export default function AdminJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  // Modals state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [unassigning, setUnassigning] = useState(false)
  const [closing, setClosing] = useState(false)

  // Add Update Form State
  const [updateTitle, setUpdateTitle] = useState("")
  const [updateDescription, setUpdateDescription] = useState("")
  const [updateStatus, setUpdateStatus] = useState("")
  const [updatePositionsFilled, setUpdatePositionsFilled] = useState<number | "">("")
  const [postingUpdate, setPostingUpdate] = useState(false)

  // Assign Form State
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("")
  const [assigning, setAssigning] = useState(false)

  // Fetch Job
  const { data: jobData, isLoading: loadingJob } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error("Failed to load job details")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch Recruiters
  const { data: recruitersData } = useQuery({
    queryKey: ["recruiters"],
    queryFn: async () => {
      const res = await fetch("/api/employees?limit=100")
      if (!res.ok) throw new Error("Failed to load recruiters")
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  const job = jobData?.job
  const recruiters: any[] = recruitersData?.employees || []

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateTitle.trim()) {
      toast.error("Update title is required")
      return
    }

    setPostingUpdate(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateType: "PROGRESS_UPDATE",
          title: updateTitle,
          description: updateDescription || null,
          newStatus: updateStatus || undefined,
          positionsFilledUpdate: updatePositionsFilled !== "" ? Number(updatePositionsFilled) : undefined,
        }),
      })

      if (res.ok) {
        toast.success("Progress update logged!")
        queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setShowUpdateModal(false)
        setUpdateTitle("")
        setUpdateDescription("")
        setUpdateStatus("")
        setUpdatePositionsFilled("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to post update")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setPostingUpdate(false)
    }
  }

  const handleAssignRecruiter = async () => {
    if (!selectedRecruiterId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiterId }),
      })

      if (res.ok) {
        toast.success("Recruiter assigned successfully!")
        queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setShowAssignModal(false)
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

  const handleUnassignRecruiter = async () => {
    setUnassigning(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/unassign`, {
        method: "POST",
      })
      if (res.ok) {
        toast.success("Recruiter unassigned")
        queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setShowUnassignConfirm(false)
      } else {
        toast.error("Failed to unassign")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setUnassigning(false)
    }
  }

  const handleCloseJob = async () => {
    setClosing(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Closed by Admin" }),
      })
      if (res.ok) {
        toast.success("Job marked as CLOSED")
        queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        setShowCloseConfirm(false)
      }
    } catch (e) {
      toast.error("Failed to close job")
    } finally {
      setClosing(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700">Job description not found</p>
        <Link href="/admin/recruitment/jobs" className="text-xs text-indigo-600 font-bold hover:underline">
          ← Back to Jobs List
        </Link>
      </div>
    )
  }

  const daysRemaining = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null
  const isUrgentDeadline = daysRemaining !== null && daysRemaining <= 3 && job.status !== "CLOSED"

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/recruitment/jobs"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                {job.jobId}
              </span>
              <h1 className="text-xl font-black text-slate-900">{job.title}</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider",
                job.status === "OPEN" && "bg-blue-50 text-blue-700 border-blue-200",
                job.status === "IN_PROGRESS" && "bg-amber-50 text-amber-700 border-amber-200",
                job.status === "ON_HOLD" && "bg-slate-100 text-slate-600 border-slate-200",
                job.status === "CLOSED" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                job.status === "CANCELLED" && "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                {job.status.replace("_", " ")}
              </span>
            </div>
            {job.clientName && (
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Client: {job.clientName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {job.assignedTo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="text-xs bg-white border-slate-200 font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Reassign Recruiter
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Assign Recruiter
            </Button>
          )}

          {job.status !== "CLOSED" && (
            <Button
              size="sm"
              onClick={() => setShowCloseConfirm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Close Job
            </Button>
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* JOB OVERVIEW CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Job Overview & Requirements
            </h2>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.skills && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.split(",").map((s: string, idx: number) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-md">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Experience</span>
                <p className="font-bold text-slate-900">{job.experienceLevel || "Not stated"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Location</span>
                <p className="font-bold text-slate-900">{job.location || "Not stated"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Work Type</span>
                <p className="font-bold text-slate-900">{job.workType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Salary Range</span>
                <p className="font-bold text-emerald-600">{job.salaryRange || "Not stated"}</p>
              </div>
            </div>
          </div>

          {/* PROGRESS UPDATES CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-indigo-600" />
                Work Progress & Updates ({job.updates?.length || 0})
              </h2>
              <Button
                size="sm"
                onClick={() => setShowUpdateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                + Log Progress Update
              </Button>
            </div>

            {/* Updates List */}
            {job.updates && job.updates.length > 0 ? (
              <div className="space-y-4">
                {job.updates.map((update: any) => (
                  <div key={update.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {getInitials(update.user?.name || "User")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{update.user?.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{update.user?.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="pl-9 space-y-1">
                      <p className="text-xs font-bold text-indigo-950">{update.title}</p>
                      {update.description && (
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{update.description}</p>
                      )}

                      {update.oldStatus && update.newStatus && (
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                          <span>Status:</span>
                          <span className="text-slate-400">{update.oldStatus}</span>
                          <span>→</span>
                          <span className="text-indigo-600 font-black">{update.newStatus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No progress updates logged yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          
          {/* ASSIGNMENT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Recruiter</h3>
            {job.assignedTo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {getInitials(job.assignedTo.name)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{job.assignedTo.name}</p>
                    <p className="text-[11px] text-slate-500">{job.assignedTo.department} • {job.assignedTo.email}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <p>Assigned On: <span className="font-bold text-slate-700">{job.assignedDate ? formatDate(job.assignedDate) : "N/A"}</span></p>
                  {job.assignedByAdmin && <p>Assigned By: <span className="font-bold text-slate-700">{job.assignedByAdmin.name}</span></p>}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignModal(true)}
                    className="flex-1 text-xs"
                  >
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnassignConfirm(true)}
                    className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3 text-center">
                <p className="text-xs font-bold text-amber-900">Not yet assigned to any recruiter</p>
                <Button
                  size="sm"
                  onClick={() => setShowAssignModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs w-full"
                >
                  + Assign Now
                </Button>
              </div>
            )}
          </div>

          {/* FULFILLMENT PROGRESS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fulfillment Progress</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">{job.positionsFilled} of {job.positionsToFill} Positions Filled</span>
                <span className="text-indigo-600 font-black">{Math.round((job.positionsFilled / Math.max(1, job.positionsToFill)) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    job.positionsFilled >= job.positionsToFill ? "bg-emerald-500" : "bg-indigo-600"
                  )}
                  style={{ width: `${Math.min(100, (job.positionsFilled / Math.max(1, job.positionsToFill)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Priority</span>
                <span className="font-black text-rose-600">{job.priority}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Status</span>
                <span className="font-bold text-slate-800">{job.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* TIMELINE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Received Date</span>
                <span className="font-bold text-slate-800">{formatDate(job.receivedDate)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Target Deadline</span>
                <span className={cn("font-bold", isUrgentDeadline ? "text-rose-600" : "text-slate-800")}>
                  {job.deadline ? formatDate(job.deadline) : "No deadline"}
                </span>
              </div>
              {job.closedDate && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-emerald-800 font-bold">Closed Date</span>
                  <span className="font-black text-emerald-700">{formatDate(job.closedDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* JD DOCUMENT LINK CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">JD Document Link</h3>
            {job.jdDocumentUrl ? (
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                <p className="text-xs font-bold text-indigo-900 truncate">{job.jdDocumentName || "JD Document Link"}</p>
                <a
                  href={job.jdDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Document Link
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No JD link uploaded</p>
            )}
          </div>
        </div>
      </div>

      {/* LOG PROGRESS UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Progress Update</h3>
              <button onClick={() => setShowUpdateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Update Summary Title *</Label>
                <Input
                  placeholder="e.g. Sourced 5 candidates, 2 interviews scheduled"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Detailed Notes / Feedback</Label>
                <Textarea
                  placeholder="Add specific candidate notes, feedback from client, screening details..."
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Change Status (Optional)</Label>
                  <Select value={updateStatus} onValueChange={(val) => val && setUpdateStatus(val)}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Keep current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">🔵 OPEN</SelectItem>
                      <SelectItem value="IN_PROGRESS">🟠 IN PROGRESS</SelectItem>
                      <SelectItem value="ON_HOLD">⚪ ON HOLD</SelectItem>
                      <SelectItem value="CLOSED">🟢 CLOSED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Total Positions Filled</Label>
                  <Input
                    type="number"
                    min={0}
                    max={job.positionsToFill}
                    placeholder={`Current: ${job.positionsFilled}`}
                    value={updatePositionsFilled}
                    onChange={(e) => setUpdatePositionsFilled(e.target.value ? Number(e.target.value) : "")}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={postingUpdate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {postingUpdate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN RECRUITER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Assign Recruiter</h3>
            <p className="text-xs text-slate-500">
              Select an employee to handle recruitment for <span className="font-bold text-slate-800">{job.title}</span>.
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
                onClick={() => setShowAssignModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAssignRecruiter}
                disabled={assigning || !selectedRecruiterId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* UNASSIGN CONFIRM MODAL */}
      <ConfirmModal
        open={showUnassignConfirm}
        onClose={() => setShowUnassignConfirm(false)}
        onConfirm={handleUnassignRecruiter}
        title="Unassign Recruiter?"
        description={`Are you sure you want to remove ${job?.assignedTo?.name} from this recruitment job?`}
        confirmText="Remove Recruiter"
        variant="destructive"
        loading={unassigning}
      />

      {/* CLOSE JOB CONFIRM MODAL */}
      <ConfirmModal
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseJob}
        title="Close Job Description?"
        description={`Are you sure you want to mark "${job?.title}" as CLOSED?`}
        confirmText="Close Job"
        variant="warning"
        loading={closing}
      />
    </div>
  )
}
