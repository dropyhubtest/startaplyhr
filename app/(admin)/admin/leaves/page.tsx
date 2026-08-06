"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { StatsCard } from "@/components/shared/stats-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn, formatDate, getInitials, timeAgo } from "@/lib/utils"
import { 
  CalendarClock, CheckCircle2, Ban, Check, X, Loader2, Info, 
  ChevronLeft, ChevronRight, CalendarDays, List, Calendar as CalendarIcon, UserX
} from "lucide-react"
import { isWeekend, isBefore } from "date-fns"

export default function AdminLeavesPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
  const [allLeaves, setAllLeaves] = useState<any[]>([])
  const [calendarData, setCalendarData] = useState<any>({})
  const [allBalances, setAllBalances] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  
  const [rejectModal, setRejectModal] = useState<{ open: boolean, leaveId: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const fetchPendingLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/leaves?status=PENDING&limit=50")
      if (res.ok) {
        const data = await res.json()
        setPendingLeaves(data.leaves)
      }
    } catch (e) {
      toast.error("Failed to fetch pending leaves")
    }
  }, [])

  const fetchAllLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
        status: statusFilter,
        employeeId: employeeFilter
      })
      const res = await fetch(`/api/leaves?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAllLeaves(data.leaves)
        setPagination(data.pagination)
      }
    } catch (e) {
      toast.error("Failed to fetch leaves")
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, employeeFilter])

  const fetchCalendar = useCallback(async (month: number, year: number) => {
    try {
      const res = await fetch(`/api/leaves/calendar?month=${month}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setCalendarData(data.calendarMap || {})
      }
    } catch (e) {
      toast.error("Failed to fetch calendar")
    }
  }, [])

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch("/api/leaves/all-balances")
      if (res.ok) {
        const data = await res.json()
        setAllBalances(data.balances)
      }
    } catch (e) {
      toast.error("Failed to fetch balances")
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?limit=100")
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
    fetchPendingLeaves()
  }, [fetchEmployees, fetchPendingLeaves])

  useEffect(() => {
    if (activeTab === "all") fetchAllLeaves()
    else if (activeTab === "calendar") fetchCalendar(calendarMonth, calendarYear)
    else if (activeTab === "balances") fetchBalances()
  }, [activeTab, fetchAllLeaves, fetchCalendar, fetchBalances, calendarMonth, calendarYear])

  const handleApprove = async (leaveId: string) => {
    setApprovingId(leaveId)
    try {
      const res = await fetch(`/api/leaves/${leaveId}/approve`, { method: "PUT" })
      if (res.ok) {
        toast.success("Leave approved!")
        setPendingLeaves(prev => prev.filter(l => l.id !== leaveId))
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to approve leave")
      }
    } catch (e) {
      toast.error("Failed to approve leave")
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (leaveId: string) => {
    setRejectingId(leaveId)
    try {
      const res = await fetch(`/api/leaves/${leaveId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminComment: rejectReason })
      })
      if (res.ok) {
        toast.success("Leave rejected")
        setPendingLeaves(prev => prev.filter(l => l.id !== leaveId))
        setRejectModal(null)
        setRejectReason("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to reject leave")
      }
    } catch (e) {
      toast.error("Failed to reject leave")
    } finally {
      setRejectingId(null)
    }
  }

  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate()
  const firstDayOfMonth = new Date(calendarYear, calendarMonth - 1, 1)
  const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const renderProgressBar = (used: number, total: number) => {
    if (total === 0) return null
    const pct = (used / total) * 100
    
    // 0-49%: green, 50-74%: yellow, 75-89%: orange, 90-100%: red
    let colorClass = "bg-emerald-500"
    if (pct >= 90) colorClass = "bg-rose-500"
    else if (pct >= 75) colorClass = "bg-orange-500"
    else if (pct >= 50) colorClass = "bg-amber-500"

    return (
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Leave Management"
        description="Review and manage employee leave requests"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Pending Requests" value={pendingLeaves.length} icon={CalendarClock} color="amber" />
        <StatsCard title="Approved This Month" value="—" icon={CheckCircle2} color="emerald" />
        <StatsCard title="Rejected This Month" value="—" icon={Ban} color="rose" />
        <StatsCard title="On Leave Today" value="—" icon={CalendarDays} color="blue" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-sm mb-6 flex overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-2 flex-1 justify-start border-0">
            <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all gap-2">
              <CalendarClock className="w-4 h-4" />
              Pending
              {pendingLeaves.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ml-1 shadow-sm">
                  {pendingLeaves.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all gap-2">
              <List className="w-4 h-4" />
              All Leaves
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="balances" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all gap-2">
              <UserX className="w-4 h-4" />
              Balances
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0 outline-none animate-fade-in">
          {pendingLeaves.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-slate-200/70 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-[15px] font-medium text-slate-900 mb-1">All caught up!</h3>
              <p className="text-[13px] text-slate-500">No pending leave requests at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[13px] font-bold text-indigo-700">{getInitials(leave.user.name)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[14px] text-slate-900 leading-tight">{leave.user.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{leave.user.employeeId}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                      {timeAgo(leave.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border shadow-sm",
                      leave.leaveType === "SICK" && "bg-rose-50 text-rose-700 border-rose-200",
                      leave.leaveType === "CASUAL" && "bg-blue-50 text-blue-700 border-blue-200",
                      leave.leaveType === "PAID" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                      leave.leaveType === "WFH" && "bg-purple-50 text-purple-700 border-purple-200",
                      leave.leaveType === "EMERGENCY" && "bg-orange-50 text-orange-700 border-orange-200",
                    )}>
                      {leave.leaveType}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-bold shadow-sm">
                      {leave.totalDays} day(s)
                    </span>
                  </div>

                  <div className="mb-4 space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      {formatDate(leave.startDate)} <span className="text-slate-400">→</span> {formatDate(leave.endDate)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Reason</span>
                      <p className="text-[13px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100/50 italic leading-relaxed">
                        "{leave.reason}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-auto">
                    <button
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[12px] font-medium text-rose-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                      onClick={() => setRejectModal({ open: true, leaveId: leave.id })}
                      disabled={approvingId === leave.id}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                      onClick={() => handleApprove(leave.id)}
                      disabled={approvingId === leave.id}
                    >
                      {approvingId === leave.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex flex-col sm:flex-row gap-3">
              <Select value={employeeFilter} onValueChange={(v) => { setEmployeeFilter(v as string); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[220px] bg-white h-9 text-[13px] border-slate-200 shadow-sm">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 shadow-lg rounded-lg">
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as string); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white h-9 text-[13px] border-slate-200 shadow-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 shadow-lg rounded-lg">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : allLeaves.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium">
                  No leaves found matching the criteria.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Type</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">From</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">To</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Days</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Applied</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Status</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allLeaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                              {getInitials(leave.user.name)}
                            </div>
                            <span className="font-semibold text-[13px] text-slate-900">{leave.user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide whitespace-nowrap shadow-sm border",
                            leave.leaveType === "SICK" && "bg-rose-50 text-rose-700 border-rose-200",
                            leave.leaveType === "CASUAL" && "bg-blue-50 text-blue-700 border-blue-200",
                            leave.leaveType === "PAID" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            leave.leaveType === "WFH" && "bg-purple-50 text-purple-700 border-purple-200",
                            leave.leaveType === "EMERGENCY" && "bg-orange-50 text-orange-700 border-orange-200",
                          )}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] font-medium text-slate-700 whitespace-nowrap">{formatDate(leave.startDate)}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-slate-700 whitespace-nowrap">{formatDate(leave.endDate)}</td>
                        <td className="px-6 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900">{leave.totalDays}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-slate-500 whitespace-nowrap">{formatDate(leave.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={leave.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {leave.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                className="w-7 h-7 flex items-center justify-center rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors shadow-sm border border-emerald-200 disabled:opacity-50"
                                onClick={() => handleApprove(leave.id)} 
                                disabled={approvingId === leave.id}
                              >
                                {approvingId === leave.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button 
                                className="w-7 h-7 flex items-center justify-center rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors shadow-sm border border-rose-200 disabled:opacity-50"
                                onClick={() => setRejectModal({ open: true, leaveId: leave.id })} 
                                disabled={approvingId === leave.id}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : leave.status === "APPROVED" ? (
                            <span className="text-[12px] font-bold text-emerald-600">Approved</span>
                          ) : leave.status === "REJECTED" ? (
                            <div className="flex items-center justify-end gap-1 text-rose-600 text-[12px] font-bold">
                              Rejected
                              {leave.adminComment && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white border-0 text-[12px]">
                                      <p>{leave.adminComment}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] font-bold text-slate-400">Cancelled</span>
                          )}
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
                  Showing page <span className="text-slate-900">{pagination.page}</span> of <span className="text-slate-900">{pagination.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={!pagination.hasPrev} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={!pagination.hasNext} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-semibold text-slate-900">Approved Leaves Calendar</h3>
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => {
                    if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear(y => y - 1) }
                    else setCalendarMonth(m => m - 1)
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-[13px] w-32 text-center text-slate-700">
                  {monthNames[calendarMonth - 1]} {calendarYear}
                </span>
                <button 
                  onClick={() => {
                    if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear(y => y + 1) }
                    else setCalendarMonth(m => m + 1)
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 rounded-xl border border-slate-100/50" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1
                const dateObj = new Date(calendarYear, calendarMonth - 1, dayNumber, 12, 0, 0)
                const dateKey = dateObj.toISOString().split("T")[0]
                const isWknd = isWeekend(dateObj)
                const onLeave = calendarData[dateKey] || []
                
                return (
                  <div key={dayNumber} className={cn(
                    "min-h-[110px] rounded-xl border p-2 flex flex-col transition-all",
                    isWknd ? "bg-slate-50/50 border-slate-100" : "bg-white border-slate-200",
                    onLeave.length > 0 && !isWknd && "ring-2 ring-indigo-500/20 bg-indigo-50/10 shadow-sm"
                  )}>
                    <p className={cn(
                      "text-[13px] mb-2 font-bold",
                      isWknd ? "text-slate-400" : "text-slate-700"
                    )}>
                      {dayNumber}
                    </p>
                    <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                      {onLeave.slice(0, 3).map((emp: any, idx: number) => (
                        <div key={idx} className={cn(
                          "text-[10px] rounded flex items-center px-1.5 py-0.5 truncate border font-bold shadow-sm",
                          emp.leaveType === "SICK" && "bg-rose-50 text-rose-700 border-rose-200",
                          emp.leaveType === "CASUAL" && "bg-blue-50 text-blue-700 border-blue-200",
                          emp.leaveType === "PAID" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          emp.leaveType === "WFH" && "bg-purple-50 text-purple-700 border-purple-200",
                          emp.leaveType === "EMERGENCY" && "bg-orange-50 text-orange-700 border-orange-200",
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1 flex-shrink-0" />
                          <span className="truncate">{(emp.name || "").split(" ")[0]}</span>
                        </div>
                      ))}
                      {onLeave.length > 3 && (
                        <div className="text-[10px] text-slate-500 font-bold pl-1 mt-0.5">
                          +{onLeave.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="balances" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900">Employee Leave Balances</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Track remaining leaves across the organization</p>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3 w-40">Sick Leave</th>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3 w-40">Casual Leave</th>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3 w-40">Paid Leave</th>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3 w-40">Work From Home</th>
                    <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Total Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allBalances.map(balance => {
                    const sickRem = balance.sickLeave - balance.usedSick
                    const casualRem = balance.casualLeave - balance.usedCasual
                    const paidRem = balance.paidLeave - balance.usedPaid
                    const wfhRem = balance.wfhLeave - balance.usedWFH
                    const totalRem = sickRem + casualRem + paidRem + wfhRem
                    
                    return (
                      <tr key={balance.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-indigo-700 border border-indigo-100">
                              {getInitials(balance.user.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-[13px] text-slate-900 leading-tight">{balance.user.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{balance.user.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-900">{balance.usedSick}/{balance.sickLeave}</span>
                              <span className="text-slate-500">{sickRem} left</span>
                            </div>
                            {renderProgressBar(balance.usedSick, balance.sickLeave)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-900">{balance.usedCasual}/{balance.casualLeave}</span>
                              <span className="text-slate-500">{casualRem} left</span>
                            </div>
                            {renderProgressBar(balance.usedCasual, balance.casualLeave)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-900">{balance.usedPaid}/{balance.paidLeave}</span>
                              <span className="text-slate-500">{paidRem} left</span>
                            </div>
                            {renderProgressBar(balance.usedPaid, balance.paidLeave)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-900">{balance.usedWFH}/{balance.wfhLeave}</span>
                              <span className="text-slate-500">{wfhRem} left</span>
                            </div>
                            {renderProgressBar(balance.usedWFH, balance.wfhLeave)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-[12.5px] border border-slate-200 shadow-sm inline-block min-w-[70px] text-center">
                            {totalRem} d
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {allBalances.length === 0 && (
                <div className="p-16 text-center text-slate-500 font-medium">No active employees found.</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectModal?.open || false} onOpenChange={(open) => !open && setRejectModal(null)}>
        <DialogContent className="max-w-md border-slate-200 p-0 overflow-hidden rounded-xl">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold text-slate-900">Reject Leave Request</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1.5">
                Please provide a reason for rejection. This will be shared with the employee.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 mt-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none border-slate-200 focus-visible:ring-1 focus-visible:ring-rose-500 text-[13px] bg-slate-50/50"
              />
              <p className="text-[11px] font-medium text-slate-500">Minimum 5 characters required</p>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button 
              className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium shadow-sm transition-all"
              onClick={() => setRejectModal(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={() => rejectModal && handleReject(rejectModal.leaveId)}
              disabled={rejectReason.length < 5 || rejectingId !== null}
            >
              {rejectingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Reject Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
