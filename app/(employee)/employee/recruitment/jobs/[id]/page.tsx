"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { 
  ArrowLeft, Briefcase, Clock, CheckCircle2, MessageSquarePlus, 
  ExternalLink, UserCheck, Loader2, X, PlusCircle
} from "lucide-react"
import { cn, getInitials, formatDate } from "@/lib/utils"

import { ConfirmModal } from "@/components/ui-v2/confirm-modal"

export default function EmployeeJobDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  // Modals
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showHiredConfirm, setShowHiredConfirm] = useState(false)
  const [hiring, setHiring] = useState(false)

  // Form State
  const [updateTitle, setUpdateTitle] = useState("")
  const [updateDescription, setUpdateDescription] = useState("")
  const [updateStatus, setUpdateStatus] = useState("")
  const [updatePositionsFilled, setUpdatePositionsFilled] = useState<number | "">("")
  const [postingUpdate, setPostingUpdate] = useState(false)

  // Fetch Job Details
  const { data: jobData, isLoading: loading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error("Failed to load job details")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const job = jobData?.job

  const handleQuickMarkHired = async () => {
    if (!job) return
    const nextCount = job.positionsFilled + 1
    if (nextCount > job.positionsToFill) {
      toast.error("All positions already filled!")
      return
    }

    setHiring(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateType: "HIRED",
          title: `Candidate Hired! (${nextCount}/${job.positionsToFill})`,
          positionsFilledUpdate: nextCount,
          newStatus: nextCount >= job.positionsToFill ? "CLOSED" : "IN_PROGRESS",
        }),
      })
      if (res.ok) {
        toast.success(nextCount >= job.positionsToFill ? "🎉 All positions filled & Job closed!" : "Candidate hire logged!")
        queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        queryClient.invalidateQueries({ queryKey: ["my-jobs"] })
      }
    } catch (e) {
      toast.error("Failed to log hire")
    } finally {
      setHiring(false)
    }
  }

  const handlePostUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
        queryClient.invalidateQueries({ queryKey: ["my-jobs"] })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700">Job description not found or access denied</p>
        <Link href="/employee/recruitment/jobs" className="text-xs text-indigo-600 font-bold hover:underline">
          ← Back to My Assigned Jobs
        </Link>
      </div>
    )
  }

  const daysRemaining = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null
  const isUrgentDeadline = daysRemaining !== null && daysRemaining <= 3 && job.status !== "CLOSED"

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/employee/recruitment/jobs"
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
                job.status === "CLOSED" && "bg-emerald-50 text-emerald-700 border-emerald-200"
              )}>
                {job.status.replace("_", " ")}
              </span>
            </div>
            {job.clientName && (
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Client: {job.clientName}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {job.status !== "CLOSED" && (
            <Button
              size="sm"
              onClick={() => setShowHiredConfirm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              + Mark 1 Hired
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setShowUpdateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
            Add Progress Update
          </Button>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* JOB OVERVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Job Overview
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
                <p className="font-bold text-slate-900">{job.experienceLevel || "N/A"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Location</span>
                <p className="font-bold text-slate-900">{job.location || "N/A"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Work Type</span>
                <p className="font-bold text-slate-900">{job.workType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Salary Range</span>
                <p className="font-bold text-emerald-600">{job.salaryRange || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* PROGRESS UPDATES */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-indigo-600" />
                Work Log & Updates Timeline ({job.updates?.length || 0})
              </h2>
              <Button
                size="sm"
                onClick={() => setShowUpdateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                + Log Progress
              </Button>
            </div>

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
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-600">No work updates logged yet</p>
                <p className="text-[11px] text-slate-400">Click "+ Add Progress Update" above to report candidate sourcing or status.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          
          {/* FULFILLMENT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recruitment Target</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">{job.positionsFilled} of {job.positionsToFill} Hired</span>
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
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Deadline</span>
                <span className={cn("font-bold", isUrgentDeadline ? "text-rose-600" : "text-slate-800")}>
                  {job.deadline ? formatDate(job.deadline) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* JD DOCUMENT LINK */}
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
              <p className="text-xs text-slate-400 italic">No JD link provided</p>
            )}
          </div>
        </div>
      </div>

      {/* LOG UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Recruitment Progress</h3>
              <button onClick={() => setShowUpdateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Update Summary Title *</Label>
                <Input
                  placeholder="e.g. Screened 8 profiles, sent 3 to client for review"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Detailed Notes</Label>
                <Textarea
                  placeholder="Notes on candidates, screening results, next steps..."
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Update Status</Label>
                  <Select value={updateStatus} onValueChange={(val) => val && setUpdateStatus(val)}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Keep current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">🟠 IN PROGRESS</SelectItem>
                      <SelectItem value="ON_HOLD">⚪ ON HOLD</SelectItem>
                      <SelectItem value="CLOSED">🟢 CLOSED (Finished)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Positions Filled Count</Label>
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
      {/* CONFIRM HIRED MODAL */}
      <ConfirmModal
        open={showHiredConfirm}
        onClose={() => setShowHiredConfirm(false)}
        onConfirm={handleQuickMarkHired}
        title="Confirm Candidate Hire"
        description={`Are you sure you want to mark 1 candidate hired for "${job?.title}"? (${(job?.positionsFilled || 0) + 1}/${job?.positionsToFill} filled)`}
        confirmText="Confirm Hire"
        variant="success"
        loading={hiring}
      />
    </div>
  )
}
