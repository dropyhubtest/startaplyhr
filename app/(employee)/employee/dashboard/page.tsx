"use client"

import { useAuth } from "@/hooks/use-auth"
import { useClockActions } from "@/hooks/use-clock-actions"
import { PageHeader } from "@/components/shared/page-header"
import { AnnouncementCard } from "@/components/shared/announcement-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Play, Square, Coffee, Loader2, Megaphone, CheckSquare, Clock, Briefcase } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useTasks } from "@/hooks/queries/use-tasks"
import { useAllLeaves } from "@/hooks/queries/use-leaves"
import { useQuery } from "@tanstack/react-query"

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    currentStatus,
    attendanceLog,
    workSeconds,
    breakSeconds,
    isLoading: clockLoading,
    handleClockIn,
    handleBreakStart,
    handleBreakEnd,
    handleClockOut,
  } = useClockActions()

  const { data: tasksData, isLoading: tasksLoading } = useTasks()
  const { data: leavesData, isLoading: leavesLoading } = useAllLeaves()
  const { data: annData, isLoading: annLoading } = useQuery({
    queryKey: ["announcements", "limit-3"],
    queryFn: () => fetch("/api/announcements?limit=3").then((r) => r.json()),
    staleTime: 30 * 1000,
  })
  const { data: myJobsData } = useQuery({
    queryKey: ["my-jobs", "dashboard-summary"],
    queryFn: () => fetch("/api/jobs?limit=50").then((r) => r.json()),
    staleTime: 60 * 1000,
  })

  const tasks = tasksData?.tasks || []
  const leaves = leavesData?.leaves || []
  const recentAnnouncements = annData?.announcements || []
  const myAssignedJobs = myJobsData?.jobs || []
  const activeJobsCount = myAssignedJobs.filter((j: any) => j.status === "IN_PROGRESS" || j.status === "OPEN").length
  const loading = tasksLoading || leavesLoading || annLoading

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const pendingTasks = tasks.filter((t: any) => t.status !== "COMPLETED").slice(0, 4)
  const approvedLeaves = leaves.filter((l: any) => l.status === "APPROVED")

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')?.[0] || 'there'}`}
        description="Here's a quick overview of your day."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COL - Clock & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Clock Widget */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/40 to-blue-50/20 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div>
              <h3 className="font-bold text-slate-900 text-[18px] mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Time Tracker
              </h3>
              
              <div className="mt-2 h-6 flex items-center">
                {currentStatus === "NOT_STARTED" && <p className="text-slate-500 text-[13px] font-medium">Ready to start your day?</p>}
                {currentStatus === "WORKING" && <p className="text-emerald-600 font-bold text-[13px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 w-fit"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"/> Currently Working</p>}
                {currentStatus === "ON_BREAK" && <p className="text-amber-600 font-bold text-[13px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 w-fit"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"/> On Break</p>}
                {currentStatus === "COMPLETED" && <p className="text-indigo-600 font-bold text-[13px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 w-fit"><CheckSquare className="w-4 h-4"/> Work Completed</p>}
                {currentStatus === "LOADING" && <p className="text-slate-500 text-[13px] flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-1.5"/> Loading status...</p>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto z-10 bg-white/50 p-1 md:bg-transparent md:p-0 rounded-xl backdrop-blur-sm">
              {(currentStatus === "WORKING" || currentStatus === "ON_BREAK") && (
                <div className="text-center sm:text-right px-4 sm:border-r border-slate-200">
                  <p className="text-[28px] font-mono font-bold text-slate-900 tabular-nums tracking-tighter leading-none">
                    {formatSeconds(currentStatus === "ON_BREAK" ? breakSeconds : workSeconds)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    {currentStatus === "ON_BREAK" ? "Break Time" : "Work Time"}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                {currentStatus === "NOT_STARTED" && (
                  <button 
                    onClick={handleClockIn} 
                    disabled={clockLoading} 
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    Clock In
                  </button>
                )}
                
                {currentStatus === "WORKING" && (
                  <>
                    <button 
                      onClick={handleBreakStart} 
                      disabled={clockLoading} 
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Coffee className="w-4 h-4" /> Break
                    </button>
                    <button 
                      onClick={handleClockOut} 
                      disabled={clockLoading} 
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Square className="w-4 h-4 fill-white" /> Clock Out
                    </button>
                  </>
                )}
                
                {currentStatus === "ON_BREAK" && (
                  <button 
                    onClick={handleBreakEnd} 
                    disabled={clockLoading} 
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" /> Resume Work
                  </button>
                )}
                
                {currentStatus === "COMPLETED" && (
                  <button 
                    onClick={() => router.push("/employee/attendance")}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-sm transition-all active:scale-[0.98]"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-indigo-50/30">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-[14px]">
                <CheckSquare className="w-4 h-4 text-indigo-500" /> Pending Tasks
              </h3>
              <Link href="/employee/tasks" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm transition-colors">View All</Link>
            </div>
            
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : pendingTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-[13px] font-medium">No pending tasks. Great job!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingTasks.map((task: any) => (
                  <div key={task.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-900 text-[13px] group-hover:text-indigo-700 transition-colors">{task.title}</p>
                      <div className="flex gap-2 mt-2">
                        <StatusBadge status={task.status} size="sm" />
                        <StatusBadge status={task.priority} size="sm" />
                      </div>
                    </div>
                    {task.deadline && (
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</p>
                        <p className={`text-[12px] font-semibold px-2 py-0.5 rounded-md border ${new Date(task.deadline) < new Date() ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                          {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COL - Announcements & Quick Stats */}
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="bg-indigo-50 rounded-xl border border-indigo-100/50 p-4 text-center shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1 relative z-10">Tasks Done</p>
              <p className="text-[32px] font-black text-indigo-900 leading-none relative z-10">{tasks.filter((t: any) => t.status === "COMPLETED").length}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-100/50 p-4 text-center shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1 relative z-10">Leaves Used</p>
              <p className="text-[32px] font-black text-emerald-900 leading-none relative z-10">
                {approvedLeaves.reduce((sum: number, l: any) => {
                  let count = 0
                  const current = new Date(l.startDate)
                  const end = new Date(l.endDate)
                  while (current <= end) {
                    if (current.getDay() !== 0 && current.getDay() !== 6) count++
                    current.setDate(current.getDate() + 1)
                  }
                  return sum + count
                }, 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-[12px] uppercase tracking-wider">
              <Megaphone className="w-4 h-4 text-indigo-500" /> Latest Announcements
            </h3>
            
            <div className="space-y-3">
              {loading ? (
                 <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : recentAnnouncements.length === 0 ? (
                <p className="text-[13px] font-medium text-slate-500 text-center p-8 border border-dashed border-slate-200 rounded-lg">No recent announcements.</p>
              ) : (
                recentAnnouncements.map((ann: any) => (
                  <AnnouncementCard key={ann.id} announcement={ann} isAdmin={false} />
                ))
              )}
            </div>
            
            {recentAnnouncements.length > 0 && (
              <button 
                onClick={() => router.push("/employee/announcements")}
                className="w-full mt-4 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold hover:bg-slate-100 transition-colors"
              >
                View All Announcements
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
