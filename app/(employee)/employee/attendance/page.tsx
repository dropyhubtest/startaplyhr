"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useClockActions } from "@/hooks/use-clock-actions"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeader } from "@/components/shared/page-header"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { 
  Play, Coffee, Square, CheckCircle, ChevronLeft, ChevronRight, Loader2, Clock, Calendar
} from "lucide-react"
import { formatDate, formatTime, formatDuration, cn } from "@/lib/utils"
import { isBefore, isWeekend } from "date-fns"

export default function EmployeeAttendancePage() {
  const { user } = useAuth()
  const {
    currentStatus,
    attendanceLog,
    workSeconds,
    breakSeconds,
    maxBreakMinutes,
    isLoading,
    handleClockIn,
    handleBreakStart,
    handleBreakEnd,
    handleClockOut: clockOutAction,
  } = useClockActions(() => {
    fetchMonthly(selectedMonth, selectedYear)
  })

  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false)
  
  // Monthly Data
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyAttendance, setMonthlyAttendance] = useState<any>(null)
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null)

  const fetchMonthly = useCallback(async (month: number, year: number) => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/employees/${user.id}/attendance?month=${month}&year=${year}`)
      if (res.ok) {
        setMonthlyAttendance(await res.json())
      }
    } catch (error) {
      console.error(error)
    }
  }, [user])

  useEffect(() => {
    fetchMonthly(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, fetchMonthly])

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const handleClockOut = async () => {
    await clockOutAction()
    setShowClockOutConfirm(false)
  }

  // Current Live Time Display
  const [liveClock, setLiveClock] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setLiveClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Calendar logic
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const today = new Date()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Time & Attendance"
        description="Track your daily work hours, breaks, and view your monthly attendance history."
      />

      {/* CLOCK WIDGET */}
      {currentStatus === "LOADING" ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : currentStatus === "NOT_STARTED" ? (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-10 text-center max-w-lg mx-auto animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/40 to-blue-50/20 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

          <p className="text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            {liveClock.toLocaleDateString('en-US', { weekday: 'long' })}, {formatDate(liveClock)}
          </p>
          <p className="text-[52px] font-bold text-slate-900 font-mono mb-4 tabular-nums leading-none">
            {liveClock.toLocaleTimeString('en-US', { hour12: false })}
          </p>
          <p className="text-[14px] text-slate-500 mb-8 font-medium">
            You haven't started work yet today. Ready to jump in?
          </p>
          <button 
            className="inline-flex items-center justify-center gap-2 h-14 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[16px] font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto"
            onClick={handleClockIn}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-white" />}
            Start Work
          </button>
        </div>
      ) : currentStatus === "WORKING" ? (
        <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm p-10 text-center max-w-lg mx-auto relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 animate-pulse" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-emerald-700 font-bold text-[14px] uppercase tracking-wider">Currently Working</span>
          </div>
          <p className="text-[13px] font-medium text-slate-500 mb-2">
            Started at {attendanceLog?.loginTime ? formatTime(attendanceLog.loginTime) : ''}
            {attendanceLog?.isLate && <span className="ml-2 text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-md">(Late)</span>}
          </p>
          <p className="text-[64px] font-bold text-slate-900 font-mono mb-2 tabular-nums tracking-tighter leading-none">
            {formatSeconds(workSeconds)}
          </p>
          <p className="text-[11px] text-slate-400 mb-6 uppercase tracking-wider font-bold">Hours Worked Today</p>
          
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 inline-flex items-center gap-2 mb-8">
            <Coffee className="w-4 h-4 text-slate-400" />
            <span className="text-[13px] font-medium text-slate-600">
              Break time today: <span className="font-bold text-slate-900">{formatDuration(attendanceLog?.totalBreakMinutes || 0)}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 text-[14px] font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={handleBreakStart} disabled={isLoading}
            >
              <Coffee className="w-5 h-5" />
              Take Break
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={() => setShowClockOutConfirm(true)} disabled={isLoading}
            >
              <Square className="w-5 h-5 fill-white" />
              Clock Out
            </button>
          </div>
        </div>
      ) : currentStatus === "ON_BREAK" ? (
        <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-10 text-center max-w-lg mx-auto relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-bold text-[14px] uppercase tracking-wider">On Break</span>
          </div>
          <p className={cn(
            "text-[64px] font-bold font-mono tabular-nums mb-2 tracking-tighter leading-none",
            breakSeconds < 45 * 60 ? "text-slate-900" : breakSeconds < 60 * 60 ? "text-amber-600" : "text-rose-600"
          )}>
            {formatSeconds(breakSeconds)}
          </p>
          <p className="text-[11px] text-slate-400 mb-4 uppercase tracking-wider font-bold">Break Duration</p>
          <p className="text-[13px] font-medium text-slate-500 mb-4 bg-slate-50 border border-slate-100 rounded-lg py-2 inline-block px-4">
            Work today: <span className="font-bold text-slate-900">{formatSeconds(workSeconds)}</span>
          </p>
          
          <div className="w-full max-w-xs mx-auto mb-8 mt-6">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              <span>Break used today</span>
              <span>{Math.floor(breakSeconds / 60) + (attendanceLog?.totalBreakMinutes || 0)} / {maxBreakMinutes} min</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  ((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) < 45 ? "bg-emerald-500" : 
                  ((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) < 60 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${Math.min(100, (((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) / maxBreakMinutes) * 100)}%` }}
              />
            </div>
            {((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) >= 45 && ((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) < 60 && (
              <p className="text-[12px] text-amber-600 mt-2 font-bold">⚠️ Approaching break limit</p>
            )}
            {((breakSeconds/60) + (attendanceLog?.totalBreakMinutes || 0)) >= 60 && (
              <p className="text-[12px] text-rose-600 mt-2 font-bold animate-pulse">🔴 Break limit exceeded!</p>
            )}
          </div>
          
          <button 
            className="inline-flex items-center justify-center gap-2 h-14 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto text-[16px] font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
            onClick={handleBreakEnd} disabled={isLoading}
          >
            <Play className="w-6 h-6 fill-white" />
            Resume Work
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm p-10 text-center max-w-lg mx-auto relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-[24px] font-bold text-slate-900 mb-1">Work Complete for Today!</h3>
          <p className="text-slate-500 mb-8 text-[14px] font-medium">Great job today. Enjoy your time off!</p>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Login</p>
              <p className="font-bold text-slate-900 text-[14px]">{attendanceLog?.loginTime ? formatTime(attendanceLog.loginTime) : '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Logout</p>
              <p className="font-bold text-slate-900 text-[14px]">{attendanceLog?.logoutTime ? formatTime(attendanceLog.logoutTime) : '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Status</p>
              <StatusBadge status={attendanceLog?.status} size="sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Time</p>
              <p className="font-bold text-emerald-700 text-[18px]">{formatDuration(attendanceLog?.totalWorkMinutes || 0)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Break Time</p>
              <p className="font-bold text-amber-700 text-[18px]">{formatDuration(attendanceLog?.totalBreakMinutes || 0)}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-100/50"></div>
              <div className="relative z-10">
                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">Net Work</p>
                <p className="font-black text-indigo-900 text-[18px]">{formatDuration(attendanceLog?.netWorkMinutes || 0)}</p>
              </div>
            </div>
          </div>
          
          {attendanceLog?.overtimeMinutes > 0 && (
            <p className="text-[13px] font-bold text-purple-700 mt-5 bg-purple-50 px-4 py-2 rounded-lg inline-block border border-purple-100 shadow-sm">
              ⭐ Overtime earned: {formatDuration(attendanceLog.overtimeMinutes)}
            </p>
          )}
        </div>
      )}

      {/* TODAY'S BREAKS */}
      {attendanceLog?.breaks && attendanceLog.breaks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-amber-50/30">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-[14px]">
              <Coffee className="w-4 h-4 text-amber-600" />
              Today's Breaks
            </h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-12">#</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">End</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLog.breaks.map((b: any, i: number) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-center text-[12px] font-medium text-slate-400">{i + 1}</td>
                    <td className="px-6 py-3 text-[13px] font-semibold text-slate-900">{formatTime(b.breakStart)}</td>
                    <td className="px-6 py-3">
                      {b.breakEnd ? (
                        <span className="text-[13px] font-semibold text-slate-900">{formatTime(b.breakEnd)}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md animate-pulse">ONGOING</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {b.breakDurationMinutes ? (
                        <span className="text-[13px] font-bold text-slate-900">{b.breakDurationMinutes}m</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY HISTORY */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden mt-8 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-[15px]">
            <Calendar className="w-5 h-5 text-indigo-500" /> Attendance History
          </h3>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => {
                if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) } 
                else { setSelectedMonth(m => m - 1) }
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-bold w-32 text-center text-slate-700">
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth - 1]} {selectedYear}
            </span>
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => {
                if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) } 
                else { setSelectedMonth(m => m + 1) }
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-6">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 rounded-xl" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNumber = i + 1
              const dateObj = new Date(selectedYear, selectedMonth - 1, dayNumber)
              let isWknd = isWeekend(dateObj)
              
              const override = monthlyAttendance?.overrides?.find((o: any) => new Date(o.date).getDate() === dayNumber)
              if (override) {
                isWknd = !override.isWorkingDay
              }
              
              const isPast = isBefore(dateObj, today) || dateObj.toDateString() === today.toDateString()
              
              const log = monthlyAttendance?.logs?.find((l: any) => new Date(l.date).getDate() === dayNumber)
              
              let cellClass = "bg-slate-50 border border-slate-100 text-slate-400"
              let label = null
              let labelClass = ""

              if (log) {
                if (log.status === "PRESENT") { cellClass = "bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm"; label = log.netWorkMinutes > 0 ? `${Math.floor(log.netWorkMinutes/60)}h` : "PRE"; labelClass = "text-emerald-700" }
                else if (log.status === "LATE") { cellClass = "bg-amber-50 border border-amber-200 text-amber-800 shadow-sm"; label = log.netWorkMinutes > 0 ? `${Math.floor(log.netWorkMinutes/60)}h` : "LAT"; labelClass = "text-amber-700" }
                else if (log.status === "ABSENT") { cellClass = "bg-rose-50 border border-rose-200 text-rose-800 shadow-sm"; label = "ABS"; labelClass = "text-rose-700" }
                else if (log.status === "LEAVE") { cellClass = "bg-blue-50 border border-blue-200 text-blue-800 shadow-sm"; label = "LEV"; labelClass = "text-blue-700" }
                else if (log.status === "HALFDAY") { cellClass = "bg-purple-50 border border-purple-200 text-purple-800 shadow-sm"; label = "HLF"; labelClass = "text-purple-700" }
              } else if (override && !override.isWorkingDay) {
                cellClass = "bg-sky-50 border border-sky-200 text-sky-800 shadow-sm"
                label = "HOL"
                labelClass = "text-sky-700"
              } else if (isPast && !isWknd) {
                cellClass = "bg-rose-50/50 border border-rose-100/50 text-rose-400"
                // No label for implicit absent, just red background as before
              } else if (!isPast && !isWknd) {
                cellClass = "bg-white border border-slate-200 text-slate-400"
              }

              return (
                <div 
                  key={dayNumber} 
                  onClick={() => log && setSelectedDayLog(log)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center p-1 md:p-2 transition-all",
                    log ? "cursor-pointer hover:scale-[1.03] hover:shadow-md active:scale-95" : "cursor-default",
                    cellClass,
                    selectedDayLog?.id === log?.id && "ring-2 ring-indigo-500 ring-offset-2"
                  )}
                >
                  <span className="font-bold text-[14px] md:text-[16px] leading-none mb-1">{dayNumber}</span>
                  {label && (
                    <span className={cn(
                      "text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-white/50",
                      labelClass
                    )}>
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {selectedDayLog && (
            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap gap-4 md:gap-8 items-center justify-between transition-all animate-fade-in shadow-sm">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">Date</span>
                <span className="font-bold text-slate-900 text-[13px]">{formatDate(new Date(selectedDayLog.date))}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">Login</span>
                <span className="font-bold text-slate-900 text-[13px]">{selectedDayLog.loginTime ? new Date(selectedDayLog.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">Logout</span>
                <span className="font-bold text-slate-900 text-[13px]">{selectedDayLog.logoutTime ? new Date(selectedDayLog.logoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">Work Hours</span>
                <span className="font-bold text-slate-900 text-[13px]">{formatDuration(selectedDayLog.netWorkMinutes)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1.5">Status</span>
                <StatusBadge status={selectedDayLog.status} size="sm" />
              </div>
            </div>
          )}

          {monthlyAttendance?.summary && (
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[12px] font-bold shadow-sm">
                Present: {monthlyAttendance.summary.present}
              </span>
              <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[12px] font-bold shadow-sm">
                Absent: {monthlyAttendance.summary.absent}
              </span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[12px] font-bold shadow-sm">
                Late: {monthlyAttendance.summary.late}
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[12px] font-bold shadow-sm">
                Leave: {monthlyAttendance.summary.leave}
              </span>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[12px] font-bold shadow-sm ml-auto flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Avg: {formatDuration(monthlyAttendance.summary.avgMinutesPerDay)}/day
              </span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showClockOutConfirm} onOpenChange={setShowClockOutConfirm}>
        <DialogContent className="max-w-sm border-slate-200 p-0 overflow-hidden rounded-xl">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold text-slate-900 flex items-center gap-2">
                <Square className="w-5 h-5 text-rose-500 fill-rose-500" />
                Clock Out?
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-2 text-[13px]">
                Are you sure you want to clock out for today? You won't be able to clock back in.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 mt-5">
              <div className="flex justify-between text-[13px] items-center">
                <span className="text-slate-500 font-semibold">Time worked</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{formatSeconds(workSeconds)}</span>
              </div>
              <div className="flex justify-between text-[13px] items-center">
                <span className="text-slate-500 font-semibold">Break time</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{formatDuration(attendanceLog?.totalBreakMinutes || 0)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-[13px] font-bold items-center">
                <span className="text-indigo-900">Net work time</span>
                <span className="text-indigo-700 text-[16px]">
                  {formatSeconds(Math.max(0, workSeconds - ((attendanceLog?.totalBreakMinutes || 0) * 60)))}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button 
              className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-semibold shadow-sm transition-all"
              onClick={() => setShowClockOutConfirm(false)}
            >
              Cancel
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={handleClockOut}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Yes, Clock Out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
