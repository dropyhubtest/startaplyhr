"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { pusherClient } from "@/lib/pusher"
import { getGreeting, formatTime, formatDuration, getInitials } from "@/lib/utils"
import { StatsCard } from "@/components/shared/stats-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatCardSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton"
import { NoAttendance } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { 
  Users, UserCheck, Coffee, UserX, CalendarClock, 
  AlertCircle, Clock, UserPlus, Calendar, Plus, Megaphone 
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import { cn } from "@/lib/utils"
import { CreateEmployeeModal } from "@/components/admin/create-employee-modal"
import { toast } from "sonner"

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  
  const [stats, setStats] = useState<any>(null)
  const [liveStatus, setLiveStatus] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([])
  const [taskStats, setTaskStats] = useState<any>(null)
  
  const [loading, setLoading] = useState({
    stats: true,
    live: true,
    activity: true,
    weekly: true,
    tasks: true,
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    const params = new URLSearchParams({
      type: "attendance", // Default to attendance export for dashboard
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      employeeId: "all",
    })
    window.location.href = `/api/reports/export?${params}`
    setTimeout(() => setExporting(false), 2000)
    toast.success("Download started!")
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats")
      if (res.ok) {
        setStats(await res.json())
        setLoading(p => ({ ...p, stats: false }))
      }
    } catch (error) {
      console.error("Failed to fetch stats", error)
    }
  }

  const fetchLiveStatus = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/live-status")
      if (res.ok) {
        setLiveStatus(await res.json())
        setLoading(p => ({ ...p, live: false }))
      }
    } catch (error) {
      console.error("Failed to fetch live status", error)
    }
  }

  const fetchActivity = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/activity-feed")
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
        setLoading(p => ({ ...p, activity: false }))
      }
    } catch (error) {
      console.error("Failed to fetch activity", error)
    }
  }

  const fetchWeekly = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/weekly-attendance")
      if (res.ok) {
        setWeeklyAttendance(await res.json())
        setLoading(p => ({ ...p, weekly: false }))
      }
    } catch (error) {
      console.error("Failed to fetch weekly attendance", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/task-stats")
      if (res.ok) {
        setTaskStats(await res.json())
        setLoading(p => ({ ...p, tasks: false }))
      }
    } catch (error) {
      console.error("Failed to fetch task stats", error)
    }
  }

  useEffect(() => {
    // Fire all API calls in parallel for faster page load
    Promise.allSettled([
      fetchStats(),
      fetchLiveStatus(),
      fetchActivity(),
      fetchWeekly(),
      fetchTasks(),
    ])

    // Auto refresh live status and stats
    const interval = setInterval(() => {
      fetchLiveStatus()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Pusher real-time updates
  useEffect(() => {
    try {
      const channel = pusherClient.subscribe("hr-dashboard")
      
      channel.bind("employee-status-changed", () => {
        fetchLiveStatus()
        fetchActivity()
      })
      
      channel.bind("new-leave-request", () => {
        fetchStats()
        fetchActivity()
      })
      
      return () => {
        pusherClient.unsubscribe("hr-dashboard")
      }
    } catch (error) {
      console.log("Pusher not configured, skipping real-time")
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-[12.5px] text-slate-500 mb-1 font-medium tracking-wide uppercase">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric", 
              month: "long",
              day: "numeric"
            })}
          </p>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            Welcome back, {session?.user?.name?.split(" ")?.[0] || "Admin"}
          </h2>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[13px] font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            {exporting ? <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" /> : null}
            Export report
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-medium shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Add employee
          </button>
        </div>
      </div>
      
      <CreateEmployeeModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchStats()
        }}
      />

      {/* Stats Grid - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <StatsCard
          title="Total employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          description={`${stats?.activeEmployees ?? 0} active`}
          loading={loading.stats}
          color="indigo"
        />
        <StatsCard
          title="Present today"
          value={stats?.presentToday ?? 0}
          icon={UserCheck}
          loading={loading.stats}
          color="emerald"
        />
        <StatsCard
          title="On break"
          value={stats?.onBreakNow ?? 0}
          icon={Coffee}
          loading={loading.stats}
          color="amber"
        />
        <StatsCard
          title="Absent"
          value={stats?.absentToday ?? 0}
          icon={UserX}
          loading={loading.stats}
          color="rose"
        />
        <StatsCard
          title="Pending leaves"
          value={stats?.pendingLeaveRequests ?? 0}
          icon={CalendarClock}
          loading={loading.stats}
          color="blue"
        />
        <StatsCard
          title="Due today"
          value={stats?.tasksDueToday ?? 0}
          icon={AlertCircle}
          loading={loading.stats}
          color="purple"
        />
      </div>

      {/* Live Status Table */}
      <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                Team activity
              </h3>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Real-time status of your team members
            </p>
          </div>
          <Link href="/admin/attendance" className="text-[13px] text-slate-500 hover:text-slate-900 font-medium transition-colors">
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3">Status</th>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3">Clock in</th>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3">Hours today</th>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3">Break</th>
                <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liveStatus.map(emp => (
                <tr key={emp.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-indigo-700">
                          {getInitials(emp.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900 leading-tight">
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {emp.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">
                    {emp.loginTime ? formatTime(emp.loginTime) : "-"}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600">
                    {emp.hoursWorkedToday > 0 ? formatDuration(emp.hoursWorkedToday) : "-"}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600">
                    {emp.breakTimeToday > 0 ? formatDuration(emp.breakTimeToday) : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/employees/${emp.userId}`}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-medium text-slate-700 shadow-sm transition-colors active:scale-[0.98]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {liveStatus.length === 0 && !loading.live && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                    <h3 className="text-[14px] font-medium text-slate-900 mb-1">No active team members</h3>
                    <p className="text-[13px] text-slate-500">Everyone has clocked out for today</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two column: Activity + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Activity feed */}
        <div className="lg:col-span-3 bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
            <h3 className="text-[15px] font-semibold text-slate-900">
              Live updates
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Recent activity from your team
            </p>
          </div>
          
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border",
                    activity.type === "LOGIN" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                    activity.type === "LOGOUT" && "bg-slate-50 text-slate-600 border-slate-200",
                    activity.type === "BREAK_START" && "bg-amber-50 text-amber-600 border-amber-100",
                    activity.type === "BREAK_END" && "bg-blue-50 text-blue-600 border-blue-100",
                    activity.type === "LEAVE_REQUEST" && "bg-purple-50 text-purple-600 border-purple-100",
                  )}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  {i < activities.length - 1 && (
                    <div className="w-px h-full min-h-[16px] bg-slate-100 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-1 pt-1">
                  <p className="text-[13px] text-slate-700 leading-snug">
                    {activity.description}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    {formatTime(activity.time)}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-[13px] text-slate-500">
                No recent activity to show.
              </div>
            )}
          </div>
        </div>

        {/* Charts sidebar */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-0.5">
              This week
            </h3>
            <p className="text-[12px] text-slate-500 mb-5">
              Attendance overview
            </p>
            
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="0" 
                  stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                />
                <Bar dataKey="present" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="absent" fill="#e2e8f0" radius={[4,4,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Tasks
              </h3>
              <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                {taskStats?.completionRate ?? 0}% complete
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mb-5">
              Current status distribution
            </p>
            
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Done", value: taskStats?.completed, fill: "#22c55e" },
                    { name: "In progress", value: taskStats?.inProgress, fill: "#6366f1" },
                    { name: "Todo", value: taskStats?.todo, fill: "#e2e8f0" },
                    { name: "Blocked", value: taskStats?.blocked, fill: "#ef4444" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
