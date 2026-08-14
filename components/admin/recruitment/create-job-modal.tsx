"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Briefcase, UserPlus, FileText, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"

interface CreateJobModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateJobModal({ open, onClose, onSuccess }: CreateJobModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])

  // Step 1 Form Data
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [description, setDescription] = useState("")
  const [skills, setSkills] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [location, setLocation] = useState("")
  const [workType, setWorkType] = useState("ONSITE")
  const [jobType, setJobType] = useState("FULL_TIME")
  const [salaryRange, setSalaryRange] = useState("")

  // Step 2 Form Data
  const [priority, setPriority] = useState("MEDIUM")
  const [deadline, setDeadline] = useState("")
  const [positionsToFill, setPositionsToFill] = useState(1)
  const [jdDocumentUrl, setJdDocumentUrl] = useState("")
  const [assignedToId, setAssignedToId] = useState("unassigned")

  useEffect(() => {
    if (open) {
      fetchRecruiters()
    }
  }, [open])

  const fetchRecruiters = async () => {
    try {
      const res = await fetch("/api/employees?limit=100")
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Job title is required")
      return
    }
    if (!description.trim() || description.length < 10) {
      toast.error("Please enter a clear job description (at least 10 characters)")
      return
    }
    if (!location.trim()) {
      toast.error("Location is required")
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. Create Job
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientName: clientName || null,
          description,
          skills: skills || null,
          experienceLevel: experienceLevel || null,
          location,
          workType,
          jobType,
          salaryRange: salaryRange || null,
          priority,
          deadline: deadline || null,
          positionsToFill: Number(positionsToFill) || 1,
          jdDocumentUrl: jdDocumentUrl || null,
          jdDocumentName: jdDocumentUrl ? "JD Link" : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create job")
      }

      const createdJob = data.job

      // 2. If recruiter assigned, post assignment
      if (assignedToId && assignedToId !== "unassigned") {
        await fetch(`/api/jobs/${createdJob.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recruiterId: assignedToId }),
        })
      }

      toast.success(`Job ${createdJob.jobId} created successfully!`)
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to create job")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-indigo-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Create New Job Description (JD)
              </DialogTitle>
              <DialogDescription className="text-indigo-200 text-xs mt-0.5">
                Add job details and assign to a recruiter
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
            <div className={cn(
              "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full transition-all",
              step === 1 ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white/70"
            )}>
              <span>1. Job Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
            <div className={cn(
              "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full transition-all",
              step === 2 ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white/70"
            )}>
              <span>2. Assignment & Timeline</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">
          {step === 1 ? (
            <form id="step-1-form" onSubmit={handleNext} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Job Title *</Label>
                  <Input
                    placeholder="e.g. Senior React Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Client / Company Name</Label>
                  <Input
                    placeholder="e.g. Acme Corp (Optional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Location *</Label>
                  <Input
                    placeholder="e.g. Bangalore / Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Job Description *</Label>
                <Textarea
                  placeholder="Paste or write detailed job description, responsibilities, and qualifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Required Skills</Label>
                  <Input
                    placeholder="React, TypeScript, Node.js"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Experience Required</Label>
                  <Input
                    placeholder="e.g. 3-5 years"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Work Type</Label>
                  <Select value={workType} onValueChange={(val) => val && setWorkType(val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONSITE">🏢 Onsite</SelectItem>
                      <SelectItem value="HYBRID">🔀 Hybrid</SelectItem>
                      <SelectItem value="REMOTE">🌐 Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Job Type</Label>
                  <Select value={jobType} onValueChange={(val) => val && setJobType(val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="PART_TIME">Part-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Salary / CTC Range</Label>
                  <Input
                    placeholder="e.g. 12-18 LPA or Competitive"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6">
                  Next: Assignment & Timeline
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 block mb-1">Priority Level *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "URGENT", label: "🔴 Urgent", color: "bg-rose-50 text-rose-700 border-rose-200" },
                      { id: "HIGH", label: "🟠 High", color: "bg-amber-50 text-amber-700 border-amber-200" },
                      { id: "MEDIUM", label: "🔵 Medium", color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { id: "LOW", label: "⚪ Low", color: "bg-slate-50 text-slate-700 border-slate-200" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5",
                          p.color,
                          priority === p.id ? "ring-2 ring-indigo-600 shadow-sm font-black" : "opacity-75 hover:opacity-100"
                        )}
                      >
                        {priority === p.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Target Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Positions to Fill</Label>
                  <Input
                    type="number"
                    min={1}
                    value={positionsToFill}
                    onChange={(e) => setPositionsToFill(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Assign to Recruiter</Label>
                  <Select value={assignedToId} onValueChange={(val) => val && setAssignedToId(val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select recruiter..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">⏳ Assign Later (Unassigned)</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          👤 {emp.name} ({emp.department} - {emp.jobTitle})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">JD Document Link (Optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/file/... or Dropbox link"
                    value={jdDocumentUrl}
                    onChange={(e) => setJdDocumentUrl(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-[11px] text-slate-400">Paste URL link to Google Drive, Dropbox, or company cloud JD document</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="text-xs h-10 px-4"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create & Save Job
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
