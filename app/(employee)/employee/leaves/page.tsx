"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { PageHeader } from "@/components/shared/page-header"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/status-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn, formatDate } from "@/lib/utils"
import { 
  Plus, X, Thermometer, Coffee, Wallet, Home, 
  Loader2, Info, CalendarDays 
} from "lucide-react"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { ConfirmModal } from "@/components/ui-v2/confirm-modal"

export default function EmployeeLeavesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancellingTargetId, setCancellingTargetId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: myLeavesQueryData, isLoading: loading } = useQuery({
    queryKey: ["my-leaves"],
    queryFn: async () => {
      const res = await fetch("/api/leaves")
      if (!res.ok) throw new Error("Failed to fetch leaves")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: balanceQueryData, isLoading: balanceLoading } = useQuery({
    queryKey: ["leaves", "balance"],
    queryFn: async () => {
      const res = await fetch("/api/leaves/balance")
      if (!res.ok) throw new Error("Failed to fetch balance")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const leaves = myLeavesQueryData?.leaves || []
  const pagination = myLeavesQueryData?.pagination
  const balance = balanceQueryData?.balance
  const remaining = balanceQueryData?.remaining

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm()

  const watchStartDate = watch("startDate")
  const watchEndDate = watch("endDate")
  const watchLeaveType = watch("leaveType")

  const handleConfirmCancelLeave = async () => {
    if (!cancellingTargetId) return
    setCancellingId(cancellingTargetId)
    try {
      const res = await fetch(`/api/leaves/${cancellingTargetId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Leave request cancelled")
        queryClient.refetchQueries({ queryKey: ["my-leaves"] })
        queryClient.refetchQueries({ queryKey: ["leaves", "balance"] })
        setCancellingTargetId(null)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to cancel")
      }
    } catch (e) {
      toast.error("Failed to cancel leave request")
    } finally {
      setCancellingId(null)
    }
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (res.ok) {
        toast.success("Leave request submitted!")
        setShowApplyForm(false)
        reset()
        queryClient.refetchQueries({ queryKey: ["my-leaves"] })
        queryClient.refetchQueries({ queryKey: ["leaves", "balance"] })
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error("Failed to submit request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate working days dynamically
  function countWorkingDays(start: string, end: string): number {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate < startDate) return 0

    let count = 0
    const current = new Date(startDate)
    while (current <= endDate) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }

  const calculatedDays = countWorkingDays(watchStartDate, watchEndDate)
  
  const getAvailableDays = () => {
    if (!remaining || !watchLeaveType) return 0
    if (watchLeaveType === "EMERGENCY") return 999
    return remaining[watchLeaveType.toLowerCase()] || 0
  }
  const available = getAvailableDays()
  const insufficientBalance = !!watchLeaveType && watchLeaveType !== "EMERGENCY" && calculatedDays > available

  const renderProgressBar = (used: number, total: number) => {
    if (total === 0) return null
    const percentage = (used / total) * 100
    return (
      <div className="w-full bg-slate-100 rounded-full h-1.5 shadow-inner overflow-hidden mt-3">
        <div 
          className={cn(
            "h-1.5 rounded-full",
            percentage < 50 && "bg-emerald-500",
            percentage >= 50 && percentage < 75 && "bg-amber-500",
            percentage >= 75 && percentage < 90 && "bg-orange-500",
            percentage >= 90 && "bg-rose-500",
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="My Leaves"
        description="View your leave balances and request time off"
        action={
          <button 
            onClick={() => setShowApplyForm(true)}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </button>
        }
      />

      {/* SECTION 1 — Leave Balance Cards */}
      {!balanceLoading && balance && remaining && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 animate-fade-in relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <Thermometer className="w-4 h-4" /> 
                <span className="font-bold text-rose-900 text-[13px]">Sick Leave</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{balance.usedSick}/{balance.sickLeave} used</span>
            </div>
            <p className="text-[32px] font-bold text-slate-900 leading-none">{remaining.sick}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Days Remaining</p>
            {renderProgressBar(balance.usedSick, balance.sickLeave)}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 animate-fade-in relative overflow-hidden group" style={{ animationDelay: "50ms" }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Coffee className="w-4 h-4" /> 
                <span className="font-bold text-blue-900 text-[13px]">Casual Leave</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{balance.usedCasual}/{balance.casualLeave} used</span>
            </div>
            <p className="text-[32px] font-bold text-slate-900 leading-none">{remaining.casual}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Days Remaining</p>
            {renderProgressBar(balance.usedCasual, balance.casualLeave)}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 animate-fade-in relative overflow-hidden group" style={{ animationDelay: "100ms" }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Wallet className="w-4 h-4" /> 
                <span className="font-bold text-emerald-900 text-[13px]">Paid Leave</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{balance.usedPaid}/{balance.paidLeave} used</span>
            </div>
            <p className="text-[32px] font-bold text-slate-900 leading-none">{remaining.paid}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Days Remaining</p>
            {renderProgressBar(balance.usedPaid, balance.paidLeave)}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 animate-fade-in relative overflow-hidden group" style={{ animationDelay: "150ms" }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Home className="w-4 h-4" /> 
                <span className="font-bold text-purple-900 text-[13px]">WFH</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{balance.usedWFH}/{balance.wfhLeave} used</span>
            </div>
            <p className="text-[32px] font-bold text-slate-900 leading-none">{remaining.wfh}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Days Remaining</p>
            {renderProgressBar(balance.usedWFH, balance.wfhLeave)}
          </div>
        </div>
      )}

      {/* SECTION 2 — Apply Leave Form */}
      <div className={cn(
        "bg-white rounded-xl border border-slate-200/70 shadow-sm mb-6 overflow-hidden transition-all duration-300",
        showApplyForm ? "max-h-[800px]" : "max-h-0 border-0 opacity-0"
      )}>
        <div className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px]">Apply for Leave</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Submit a new leave request</p>
            </div>
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
              onClick={() => setShowApplyForm(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Leave Type</label>
              <Controller
                name="leaveType"
                control={control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || null} required>
                    <SelectTrigger className="h-10 text-[13px] shadow-sm border-slate-200 bg-slate-50/50 focus:ring-indigo-500">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SICK">🤒 Sick Leave ({remaining?.sick || 0} days left)</SelectItem>
                      <SelectItem value="CASUAL">☕ Casual Leave ({remaining?.casual || 0} days left)</SelectItem>
                      <SelectItem value="PAID">💰 Paid Leave ({remaining?.paid || 0} days left)</SelectItem>
                      <SelectItem value="WFH">🏠 Work From Home ({remaining?.wfh || 0} days left)</SelectItem>
                      <SelectItem value="EMERGENCY">🚨 Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Start Date</label>
                <Input type="date" {...register("startDate")} required min={new Date().toISOString().split("T")[0]} className="h-10 text-[13px] shadow-sm border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">End Date</label>
                <Input type="date" {...register("endDate")} required min={watchStartDate || new Date().toISOString().split("T")[0]} className="h-10 text-[13px] shadow-sm border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500" />
              </div>
            </div>

            {watchStartDate && watchEndDate && (
              <div className={cn(
                "border rounded-xl p-4 flex gap-3 shadow-sm",
                insufficientBalance ? "bg-rose-50/50 border-rose-200" : "bg-indigo-50/50 border-indigo-200"
              )}>
                <CalendarDays className={cn("w-5 h-5", insufficientBalance ? "text-rose-500" : "text-indigo-500")} />
                <div>
                  <p className={cn("text-[13px] font-semibold", insufficientBalance ? "text-rose-900" : "text-indigo-900")}>
                    Duration: {calculatedDays} working days
                  </p>
                  {insufficientBalance && (
                    <p className="text-[12px] font-medium text-rose-600 mt-1">
                      ⚠️ Insufficient balance! You only have {available} days available.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Reason</label>
              <Textarea 
                placeholder="Please provide a clear reason for your leave request..."
                rows={3}
                {...register("reason", { required: true, minLength: 10 })}
                className={cn(
                  "resize-none text-[13px] shadow-sm bg-slate-50/50 focus-visible:ring-indigo-500",
                  errors.reason ? "border-rose-500 focus-visible:ring-rose-500" : "border-slate-200"
                )}
              />
              {errors.reason?.type === "required" ? (
                <p className="text-[11px] font-medium text-rose-500 mt-1.5">Reason is required</p>
              ) : errors.reason?.type === "minLength" ? (
                <p className="text-[11px] font-medium text-rose-500 mt-1.5">Reason must be at least 10 characters</p>
              ) : (
                <p className="text-[11px] font-medium text-slate-400 mt-1.5">Minimum 10 characters</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowApplyForm(false)}
                className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-sm transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || insufficientBalance || calculatedDays === 0 || !watchLeaveType}
                className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Leave Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 3 — My Leave History */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-[15px]">Leave History</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Track your past and pending requests</p>
          </div>
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter(v as string)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white h-9 text-[12px] shadow-sm font-medium border-slate-200 focus:ring-indigo-500">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : leaves.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CalendarDays className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-900">No leave requests found</p>
              <p className="text-[12px] text-slate-500 mt-1">You haven't submitted any leave requests yet.</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Range</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider max-w-[200px]">Reason</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide uppercase border shadow-sm",
                        leave.leaveType === "SICK" && "bg-rose-50 border-rose-200 text-rose-700",
                        leave.leaveType === "CASUAL" && "bg-blue-50 border-blue-200 text-blue-700",
                        leave.leaveType === "PAID" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                        leave.leaveType === "WFH" && "bg-purple-50 border-purple-200 text-purple-700",
                        leave.leaveType === "EMERGENCY" && "bg-amber-50 border-amber-200 text-amber-700"
                      )}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">{formatDate(leave.startDate)}</span>
                        <span className="text-[11px] font-medium text-slate-400">to {formatDate(leave.endDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
                        {leave.totalDays} day(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-500">
                      {formatDate(leave.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={leave.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 max-w-[260px] min-w-[180px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left w-full">
                            <span className="cursor-help text-[13px] text-slate-700 font-medium hover:text-slate-900 line-clamp-2 leading-snug whitespace-pre-wrap block">
                              {leave.reason}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs whitespace-pre-wrap bg-slate-900 text-white border-slate-800 text-[12px] font-medium p-3 rounded-lg shadow-xl leading-relaxed">
                            <p>{leave.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {leave.status === "PENDING" && (
                          <button 
                            onClick={() => setCancellingTargetId(leave.id)}
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[12px] font-bold shadow-sm transition-all disabled:opacity-50"
                            disabled={cancellingId === leave.id}
                          >
                            {cancellingId === leave.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            Cancel
                          </button>
                        )}
                        {leave.status === "REJECTED" && leave.adminComment && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-help">
                                  <Info className="w-4 h-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 text-white border-slate-800 text-[12px] font-medium p-3 rounded-lg shadow-xl max-w-[250px]">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Rejection Reason</p>
                                <p>{leave.adminComment}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[12px] font-medium text-slate-500">
              Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of <span className="font-bold text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                className="h-8 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold shadow-sm transition-all disabled:opacity-50"
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              <button 
                className="h-8 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold shadow-sm transition-all disabled:opacity-50"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CANCEL LEAVE CONFIRM MODAL */}
      <ConfirmModal
        open={Boolean(cancellingTargetId)}
        onClose={() => setCancellingTargetId(null)}
        onConfirm={handleConfirmCancelLeave}
        title="Cancel Leave Request?"
        description="Are you sure you want to cancel this pending leave request?"
        confirmText="Cancel Leave"
        variant="destructive"
        loading={Boolean(cancellingId)}
      />
    </div>
  )
}
