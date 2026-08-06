"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getInitials, formatDate, formatDuration } from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal"
import { StatsCard } from "@/components/shared/stats-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  ArrowLeft, Mail, Phone, Building, CalendarDays, IndianRupee, 
  Pencil, Power, ChevronLeft, ChevronRight, Activity, CalendarCheck, FileCheck, Calendar as CalendarIcon 
} from "lucide-react"
import { toast } from "sonner"
import { isBefore, isWeekend } from "date-fns"
import { cn } from "@/lib/utils"

export default function EmployeeDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)

  // Attendance Tab State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyAttendance, setMonthlyAttendance] = useState<any>(null)
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${id}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      toast.error("Failed to load employee details")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchMonthlyAttendance = useCallback(async (month: number, year: number) => {
    setLoadingAttendance(true)
    try {
      const res = await fetch(`/api/employees/${id}/attendance?month=${month}&year=${year}`)
      if (res.ok) {
        setMonthlyAttendance(await res.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingAttendance(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchMonthlyAttendance(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, fetchMonthlyAttendance])

  const handleToggleStatus = async () => {
    try {
      const res = await fetch(`/api/employees/${id}/toggle-status`, { method: "PUT" })
      if (res.ok) {
        toast.success("Employee status updated")
        fetchData()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setShowToggleConfirm(false)
    }
  }

  if (loading) {
    return <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-sm" /></div>
  }

  if (!data || !data.employee) {
    return <div className="p-16 text-center text-slate-500 font-medium">Employee not found</div>
  }

  const { employee, attendanceSummary, leaveBalance, activeTasks } = data

  // Calendar logic
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const today = new Date()

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link href="/admin/employees" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden lg:col-span-1 h-fit">
          <div className="h-24 bg-gradient-to-r from-indigo-500 to-blue-600 relative" />
          <div className="px-6 pb-6 pt-0 text-center relative -mt-12">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md mx-auto flex items-center justify-center flex-shrink-0 relative z-10 mb-4">
              <span className="text-3xl font-bold text-indigo-700">
                {getInitials(employee.name)}
              </span>
            </div>

            <h2 className="text-[20px] font-bold text-slate-900 leading-snug">{employee.name}</h2>
            <p className="text-slate-500 text-[13px]">{employee.jobTitle}</p>
            
            <div className="flex justify-center items-center gap-2 mt-3 mb-6">
              <span className="text-[11px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded shadow-sm">
                {employee.employeeId}
              </span>
              {employee.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Inactive
                </span>
              )}
            </div>

            <div className="w-full h-px bg-slate-100 mb-6" />

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-[13px] text-slate-700 truncate font-medium">{employee.email}</p>
                </div>
              </div>
              
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Phone</p>
                    <p className="text-[13px] text-slate-700 font-medium">{employee.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Department</p>
                  <p className="text-[13px] text-slate-700 font-medium">{employee.department}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Joined</p>
                  <p className="text-[13px] text-slate-700 font-medium">{formatDate(employee.dateOfJoining)}</p>
                </div>
              </div>
              
              {employee.salary && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Salary</p>
                    <p className="text-[13px] text-slate-700 font-medium">{employee.salary.toLocaleString("en-IN")}/month</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[13px] font-medium shadow-sm transition-all active:scale-[0.98]"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
              <button 
                onClick={() => setShowToggleConfirm(true)}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg border text-[13px] font-medium shadow-sm transition-all active:scale-[0.98]",
                  employee.isActive 
                    ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                <Power className="w-4 h-4" />
                {employee.isActive ? "Deactivate Account" : "Activate Account"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Stats + Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard title="Present (Mo)" value={attendanceSummary.present} color="emerald" />
            <StatsCard title="Absent (Mo)" value={attendanceSummary.absent} color="rose" />
            <StatsCard title="Active Tasks" value={activeTasks} color="indigo" />
            <StatsCard 
              title="Leave Balance" 
              value={leaveBalance ? (leaveBalance.sickLeave - leaveBalance.usedSick) + (leaveBalance.casualLeave - leaveBalance.usedCasual) + (leaveBalance.paidLeave - leaveBalance.usedPaid) : 0} 
              color="blue" 
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
            <Tabs defaultValue="attendance" className="w-full">
              <div className="border-b border-slate-100 px-6 pt-4 bg-slate-50/50">
                <TabsList className="bg-transparent h-10 w-full justify-start gap-6 p-0 border-0">
                  <TabsTrigger value="attendance" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-slate-500">
                    <CalendarCheck className="w-4 h-4 mr-2 inline-block" />
                    Attendance
                  </TabsTrigger>
                  <TabsTrigger value="leaves" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-slate-500">
                    <CalendarIcon className="w-4 h-4 mr-2 inline-block" />
                    Leaves
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-slate-500">
                    <FileCheck className="w-4 h-4 mr-2 inline-block" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-slate-500">
                    <Activity className="w-4 h-4 mr-2 inline-block" />
                    Activity Log
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="attendance" className="mt-0 outline-none animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-semibold text-slate-900">Monthly Calendar</h3>
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                      <button 
                        onClick={handlePrevMonth}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-medium text-[13px] w-28 text-center text-slate-700">
                        {monthNames[selectedMonth - 1]} {selectedYear}
                      </span>
                      <button 
                        onClick={handleNextMonth}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {loadingAttendance ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                            {day}
                          </div>
                        ))}
                        
                        {Array.from({ length: startOffset }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square rounded-xl bg-slate-50/50 border border-slate-100/50" />
                        ))}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNumber = i + 1
                          const dateObj = new Date(selectedYear, selectedMonth - 1, dayNumber)
                          const isWknd = isWeekend(dateObj)
                          const isPast = isBefore(dateObj, today) || dateObj.toDateString() === today.toDateString()
                          
                          const log = monthlyAttendance?.logs?.find((l: any) => new Date(l.date).getDate() === dayNumber)
                          
                          let cellClass = "bg-slate-50/50 border-slate-100/50 text-slate-400"
                          if (log) {
                            if (log.status === "PRESENT") cellClass = "bg-emerald-50 border-emerald-200 text-emerald-800"
                            else if (log.status === "LATE") cellClass = "bg-amber-50 border-amber-200 text-amber-800"
                            else if (log.status === "ABSENT") cellClass = "bg-rose-50 border-rose-200 text-rose-800"
                            else if (log.status === "LEAVE") cellClass = "bg-indigo-50 border-indigo-200 text-indigo-800"
                            else if (log.status === "HALFDAY") cellClass = "bg-blue-50 border-blue-200 text-blue-800"
                          } else if (isPast && !isWknd) {
                            cellClass = "bg-rose-50/50 border-rose-100 text-rose-300" // Unmarked absent
                          } else if (!isPast && !isWknd) {
                            cellClass = "bg-white border-slate-200 text-slate-400"
                          }

                          return (
                            <div 
                              key={dayNumber} 
                              onClick={() => log && setSelectedDayLog(log)}
                              className={cn(
                                "aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition-all relative overflow-hidden",
                                log && "cursor-pointer hover:ring-2 hover:ring-indigo-500/30 hover:scale-105 shadow-sm z-10",
                                cellClass
                              )}
                            >
                              <span className="font-bold text-[13px]">{dayNumber}</span>
                              {log && (
                                <span className="text-[10px] leading-tight font-bold opacity-75 mt-0.5 tracking-tight">
                                  {log.netWorkMinutes > 0 ? `${Math.floor(log.netWorkMinutes/60)}h` : log.status.slice(0, 3)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {selectedDayLog && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-sm animate-fade-in">
                          <div>
                            <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Date</span>
                            <span className="text-[13px] font-semibold text-slate-900">{formatDate(new Date(selectedDayLog.date))}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Login</span>
                            <span className="text-[13px] font-semibold text-slate-900">{selectedDayLog.loginTime ? new Date(selectedDayLog.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Logout</span>
                            <span className="text-[13px] font-semibold text-slate-900">{selectedDayLog.logoutTime ? new Date(selectedDayLog.logoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Work Hours</span>
                            <span className="text-[13px] font-semibold text-slate-900">{formatDuration(selectedDayLog.netWorkMinutes)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-1">Status</span>
                            <StatusBadge status={selectedDayLog.status} size="sm" />
                          </div>
                        </div>
                      )}

                      {monthlyAttendance?.summary && (
                        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11.5px] font-bold shadow-sm">
                            Present: {monthlyAttendance.summary.present}
                          </span>
                          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[11.5px] font-bold shadow-sm">
                            Absent: {monthlyAttendance.summary.absent}
                          </span>
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11.5px] font-bold shadow-sm">
                            Late: {monthlyAttendance.summary.late}
                          </span>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11.5px] font-bold shadow-sm">
                            Leave: {monthlyAttendance.summary.leave}
                          </span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-[11.5px] font-bold shadow-sm ml-auto">
                            Avg: {formatDuration(monthlyAttendance.summary.avgMinutesPerDay)}/day
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="leaves" className="mt-0 outline-none text-center py-12 text-slate-400 font-medium">
                  Leave management coming soon
                </TabsContent>
                <TabsContent value="tasks" className="mt-0 outline-none text-center py-12 text-slate-400 font-medium">
                  Task management coming soon
                </TabsContent>
                <TabsContent value="activity" className="mt-0 outline-none text-center py-12 text-slate-400 font-medium">
                  Activity log coming soon
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <EditEmployeeModal
        open={showEditModal}
        employee={employee}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={showToggleConfirm}
        onClose={() => setShowToggleConfirm(false)}
        onConfirm={handleToggleStatus}
        title={employee.isActive ? "Deactivate Employee" : "Activate Employee"}
        description={`Are you sure you want to ${employee.isActive ? "deactivate" : "activate"} ${employee.name}?`}
        confirmLabel={employee.isActive ? "Deactivate" : "Activate"}
        variant={employee.isActive ? "destructive" : "default"}
      />
    </div>
  )
}
