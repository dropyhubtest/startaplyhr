"use client"

import React, { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/hooks/use-auth"
import { useClockActions } from "@/hooks/use-clock-actions"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeader } from "@/components/shared/page-header"
import { LocationConsentModal } from "@/components/employee/location-consent-modal"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { 
  Play, Coffee, Square, CheckCircle, ChevronLeft, ChevronRight, Loader2, Clock, Calendar, MapPin, Sparkles, AlertTriangle
} from "lucide-react"
import { formatDate, formatTime, formatDuration, cn } from "@/lib/utils"
import { isBefore, isWeekend } from "date-fns"

import { useQuery } from "@tanstack/react-query"

const LocationMap = dynamic(() => import("@/components/maps/location-map"), { ssr: false })

export default function EmployeeAttendancePage() {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null)
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false)

  const { data: todayAttendanceData } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/today")
      if (!res.ok) throw new Error("Failed to fetch today attendance")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: monthlyAttendanceData } = useQuery({
    queryKey: ["monthly-attendance", user?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await fetch(`/api/employees/${user.id}/attendance?month=${selectedMonth}&year=${selectedYear}`)
      if (!res.ok) throw new Error("Failed to fetch monthly attendance")
      return res.json()
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const monthlyAttendance = monthlyAttendanceData

  const {
    currentStatus,
    attendanceLog,
    workSeconds,
    breakSeconds,
    maxBreakMinutes,
    isLoading,
    showLocationConsent,
    handleClockIn,
    handleBreakStart,
    handleBreakEnd,
    handleClockOut: clockOutAction,
    handleLocationConsent,
    handleLocationDeny,
    setShowLocationConsent,
  } = useClockActions()

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

  // Current Live Time Display (60fps accuracy)
  const [liveClock, setLiveClock] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setLiveClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Shift Calculations
  const SHIFT_TARGET_SECONDS = 9 * 3600 // 9 hours
  const shiftPercent = Math.min(100, Math.round((workSeconds / SHIFT_TARGET_SECONDS) * 100))

  const estimatedEndTime = attendanceLog?.loginTime
    ? new Date(new Date(attendanceLog.loginTime).getTime() + 9 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "6:00 PM"

  const totalBreakMinutesSoFar = Math.floor(breakSeconds / 60) + (attendanceLog?.totalBreakMinutes || 0)

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

      {/* DELIGHTFUL MASTER CLOCK WIDGET */}
      {currentStatus === "LOADING" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs animate-pulse flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading attendance status...</p>
        </div>
      ) : currentStatus === "NOT_STARTED" ? (
        /* 1. NOT STARTED STATE */
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-md p-8 max-w-md mx-auto animate-in-fade">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 pointer-events-none" />
          {/* Decorative blur circle */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-gradient-to-br from-indigo-200/40 to-blue-200/30 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative z-10 text-center">
            {/* Date pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {liveClock.toLocaleDateString('en-US', { weekday: 'short' })}, {formatDate(liveClock)}
              </span>
            </div>

            {/* Live clock display */}
            <div className="mt-6 mb-2">
              <p className="text-5xl font-extrabold text-slate-900 tabular-nums tracking-tight font-mono leading-none">
                {liveClock.toLocaleTimeString('en-US', { hour12: true })}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-3">
                Ready to start your day?
              </p>
            </div>

            {/* CTA Start Work Button */}
            <button
              onClick={handleClockIn}
              disabled={isLoading}
              className="mt-6 w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-base font-bold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                  Start Work
                </>
              )}
            </button>

            {/* Shift Quick Info */}
            <div className="mt-7 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shift Starts</p>
                <p className="text-xs font-bold text-slate-900 mt-1">9:00 AM</p>
              </div>
              <div className="p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                <p className="text-xs font-bold text-slate-900 mt-1">9 Hours</p>
              </div>
              <div className="p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Break Limit</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{maxBreakMinutes} Min</p>
              </div>
            </div>
          </div>
        </div>
      ) : currentStatus === "WORKING" ? (
        /* 2. WORKING STATE */
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-emerald-200 shadow-lg shadow-emerald-500/10 p-8 max-w-md mx-auto animate-in-fade">
          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />

          {/* Status Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
              <span className="live-dot" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Currently Working
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Started at {attendanceLog?.loginTime ? formatTime(attendanceLog.loginTime) : ''}
              {attendanceLog?.isLate && (
                <span className="ml-1.5 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md text-[10px]">
                  Late
                </span>
              )}
            </span>
          </div>

          {/* Live Timer */}
          <div className="relative z-10 text-center py-4">
            <p className="text-6xl font-extrabold text-slate-900 font-mono tracking-tighter leading-none tabular-nums">
              {formatSeconds(workSeconds)}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3">
              Hours Worked Today
            </p>
          </div>

          {/* Shift Progress */}
          <div className="relative z-10 mb-6 mt-2">
            <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
              <span className="text-slate-600">Shift Progress</span>
              <span className="text-emerald-700 font-bold tabular-nums">{shiftPercent}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${shiftPercent}%` }}
              />
            </div>
          </div>

          {/* Info Row */}
          <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Break Used</p>
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatDuration(attendanceLog?.totalBreakMinutes || 0)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Est. End</p>
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {estimatedEndTime}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex gap-3">
            <button
              onClick={handleBreakStart}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-white border-2 border-amber-200 hover:bg-amber-50 text-amber-800 font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              <Coffee className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Take Break
            </button>
            <button
              onClick={() => setShowClockOutConfirm(true)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              <Square className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              Clock Out
            </button>
          </div>
        </div>
      ) : currentStatus === "ON_BREAK" ? (
        /* 3. ON BREAK STATE */
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-amber-200 shadow-lg shadow-amber-500/10 p-8 max-w-md mx-auto animate-in-fade">
          {/* Warm Amber backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              <Coffee className="w-4 h-4 text-amber-700 animate-bounce" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                On Break
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Work today: <strong className="text-slate-800">{formatSeconds(workSeconds)}</strong>
            </span>
          </div>

          {/* Break Timer */}
          <div className="relative z-10 text-center py-4">
            <p className={cn(
              "text-6xl font-extrabold font-mono tracking-tighter leading-none tabular-nums",
              totalBreakMinutesSoFar < 45 ? "text-amber-600" : totalBreakMinutesSoFar < 60 ? "text-orange-600" : "text-rose-600 animate-pulse"
            )}>
              {formatSeconds(breakSeconds)}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3">
              Break Duration
            </p>
          </div>

          {/* Break Progress Bar & Warnings */}
          <div className="relative z-10 my-6">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              <span>Break Used</span>
              <span>{totalBreakMinutesSoFar} / {maxBreakMinutes} Min</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  totalBreakMinutesSoFar < 45 ? "bg-emerald-500" : 
                  totalBreakMinutesSoFar < 60 ? "bg-amber-500" : "bg-rose-600 animate-pulse"
                )}
                style={{ width: `${Math.min(100, (totalBreakMinutesSoFar / maxBreakMinutes) * 100)}%` }}
              />
            </div>

            {totalBreakMinutesSoFar >= 45 && totalBreakMinutesSoFar < 60 && (
              <p className="text-xs text-amber-700 font-bold mt-2.5 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 py-1.5 px-3 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Approaching break limit ({maxBreakMinutes}m)
              </p>
            )}
            {totalBreakMinutesSoFar >= 60 && (
              <p className="text-xs text-rose-700 font-extrabold mt-2.5 flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-lg animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> 🔴 Break limit exceeded! Please resume work.
              </p>
            )}
          </div>

          {/* CTA Resume Button */}
          <button
            onClick={handleBreakEnd}
            disabled={isLoading}
            className="relative z-10 w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-base font-bold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                Resume Work
              </>
            )}
          </button>
        </div>
      ) : (
        /* 4. COMPLETED STATE */
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-indigo-200 shadow-lg shadow-indigo-500/10 p-8 max-w-md mx-auto text-center animate-in-fade">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 animate-in-scale">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              Work Complete for Today! 🎉
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 mb-6">
              Great job today. See you tomorrow!
            </p>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Clock In</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {attendanceLog?.loginTime ? formatTime(attendanceLog.loginTime) : "—"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Clock Out</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {attendanceLog?.logoutTime ? formatTime(attendanceLog.logoutTime) : "—"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                <StatusBadge status={attendanceLog?.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-left">
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Time</p>
                <p className="text-base font-extrabold text-emerald-900 mt-0.5 tabular-nums">
                  {formatDuration(attendanceLog?.totalWorkMinutes || 0)}
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Break Time</p>
                <p className="text-base font-extrabold text-amber-900 mt-0.5 tabular-nums">
                  {formatDuration(attendanceLog?.totalBreakMinutes || 0)}
                </p>
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200">
                <p className="text-[10px] font-bold text-indigo-700 uppercase">Net Productive</p>
                <p className="text-base font-black text-indigo-900 mt-0.5 tabular-nums">
                  {formatDuration(attendanceLog?.netWorkMinutes || 0)}
                </p>
              </div>
            </div>

            {attendanceLog?.overtimeMinutes > 0 && (
              <div className="mt-5 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 flex items-center justify-center gap-1.5 shadow-xs">
                <Sparkles className="w-4 h-4 text-purple-600" /> Overtime earned: {formatDuration(attendanceLog.overtimeMinutes)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TODAY'S BREAKS */}
      {attendanceLog?.breaks && attendanceLog.breaks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-xs overflow-hidden max-w-md mx-auto animate-in-fade">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Coffee className="w-4 h-4 text-amber-600" />
              Today's Breaks
            </h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-2.5 text-center w-10">#</th>
                  <th className="px-5 py-2.5">Start</th>
                  <th className="px-5 py-2.5">End</th>
                  <th className="px-5 py-2.5 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {attendanceLog.breaks.map((b: any, i: number) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-center font-medium text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{formatTime(b.breakStart)}</td>
                    <td className="px-5 py-3">
                      {b.breakEnd ? (
                        <span className="font-semibold text-slate-900">{formatTime(b.breakEnd)}</span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">ONGOING</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      {b.breakDurationMinutes ? `${b.breakDurationMinutes}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-8 animate-in-fade">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" /> Attendance History
          </h3>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs w-fit">
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              onClick={() => {
                if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) } 
                else { setSelectedMonth(m => m - 1) }
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold w-32 text-center text-slate-700">
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth - 1]} {selectedYear}
            </span>
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
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
                if (log.status === "PRESENT") { cellClass = "bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs"; label = log.netWorkMinutes > 0 ? `${Math.floor(log.netWorkMinutes/60)}h` : "PRE"; labelClass = "text-emerald-700" }
                else if (log.status === "LATE") { cellClass = "bg-amber-50 border border-amber-200 text-amber-800 shadow-xs"; label = log.netWorkMinutes > 0 ? `${Math.floor(log.netWorkMinutes/60)}h` : "LAT"; labelClass = "text-amber-700" }
                else if (log.status === "ABSENT") { cellClass = "bg-rose-50 border border-rose-200 text-rose-800 shadow-xs"; label = "ABS"; labelClass = "text-rose-700" }
                else if (log.status === "LEAVE") { cellClass = "bg-blue-50 border border-blue-200 text-blue-800 shadow-xs"; label = "LEV"; labelClass = "text-blue-700" }
                else if (log.status === "HALFDAY") { cellClass = "bg-purple-50 border border-purple-200 text-purple-800 shadow-xs"; label = "HLF"; labelClass = "text-purple-700" }
              } else if (override && !override.isWorkingDay) {
                cellClass = "bg-sky-50 border border-sky-200 text-sky-800 shadow-xs"
                label = "HOL"
                labelClass = "text-sky-700"
              } else if (isPast && !isWknd) {
                cellClass = "bg-rose-50/50 border border-rose-100/50 text-rose-400"
              } else if (!isPast && !isWknd) {
                cellClass = "bg-white border border-slate-200 text-slate-400"
              }

              return (
                <div 
                  key={dayNumber} 
                  onClick={() => log && setSelectedDayLog(log)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center p-1 md:p-2 transition-all",
                    log ? "cursor-pointer hover:scale-[1.03] hover:shadow-sm active:scale-95" : "cursor-default",
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
            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap gap-4 md:gap-8 items-center justify-between transition-all animate-in-fade shadow-xs">
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
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[12px] font-bold shadow-xs">
                Present: {monthlyAttendance.summary.present}
              </span>
              <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[12px] font-bold shadow-xs">
                Absent: {monthlyAttendance.summary.absent}
              </span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[12px] font-bold shadow-xs">
                Late: {monthlyAttendance.summary.late}
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[12px] font-bold shadow-xs">
                Leave: {monthlyAttendance.summary.leave}
              </span>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[12px] font-bold shadow-xs ml-auto flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Avg: {formatDuration(monthlyAttendance.summary.avgMinutesPerDay)}/day
              </span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showClockOutConfirm} onOpenChange={setShowClockOutConfirm}>
        <DialogContent className="max-w-sm border-slate-200 p-0 overflow-hidden rounded-2xl">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
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
                <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-xs border border-slate-200">{formatSeconds(workSeconds)}</span>
              </div>
              <div className="flex justify-between text-[13px] items-center">
                <span className="text-slate-500 font-semibold">Break time</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-xs border border-slate-200">{formatDuration(attendanceLog?.totalBreakMinutes || 0)}</span>
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
              className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-bold shadow-xs transition-all cursor-pointer"
              onClick={() => setShowClockOutConfirm(false)}
            >
              Cancel
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              onClick={handleClockOut}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Yes, Clock Out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Consent Modal */}
      <LocationConsentModal
        open={showLocationConsent}
        onClose={() => setShowLocationConsent(false)}
        onConsent={handleLocationConsent}
        onDeny={handleLocationDeny}
      />

      {/* Mini Map Preview after clock-in */}
      {attendanceLog?.loginLatitude && attendanceLog?.loginLongitude && currentStatus !== "LOADING" && currentStatus !== "NOT_STARTED" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden max-w-md mx-auto animate-in-fade">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Clock-in Location
            </h3>
            {attendanceLog?.loginCity && (
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {attendanceLog.loginCity}
              </span>
            )}
          </div>
          <LocationMap
            loginLatitude={attendanceLog.loginLatitude}
            loginLongitude={attendanceLog.loginLongitude}
            loginAddress={attendanceLog.loginAddress}
            logoutLatitude={attendanceLog.logoutLatitude}
            logoutLongitude={attendanceLog.logoutLongitude}
            logoutAddress={attendanceLog.logoutAddress}
            height="200px"
            showRoute={false}
          />
          {attendanceLog?.totalDistanceKm > 0 && (
            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-slate-600">📍 Distance Recorded: {attendanceLog.totalDistanceKm} km</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
