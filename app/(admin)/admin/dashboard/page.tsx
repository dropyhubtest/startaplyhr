"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getInitials, formatDate, formatTime, formatDuration, timeAgo } from "@/lib/utils"
import { AnimatedNumber } from "@/components/ui-v2/animated-number"
import { Sparkline } from "@/components/ui-v2/sparkline"
import { StatusPill } from "@/components/ui-v2/status-pill"
import {
  Users, UserCheck, Coffee, UserX, CalendarDays, CheckSquare,
  ArrowUpRight, ArrowUp, ArrowDown, UserPlus, Clock, Sparkles,
  BarChart3, ChevronRight, Activity, Bell, FileText, ArrowRight,
  Briefcase,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"

const TASK_COLORS = ["#6366F1", "#3B82F6", "#22C55E", "#EF4444"]

import { 
  useDashboardStats, 
  useLiveStatus, 
  useWeeklyAttendance, 
  useActivityFeed, 
  useTaskStats 
} from "@/hooks/queries/use-dashboard"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  
  const { data: stats } = useDashboardStats()
  const { data: liveStatus = [] } = useLiveStatus()
  const { data: weeklyAttendance = [] } = useWeeklyAttendance()
  const { data: activityFeed = [] } = useActivityFeed()
  const { data: taskStats } = useTaskStats()

  const { data: jobsData } = useQuery({
    queryKey: ["jobs", "dashboard-summary"],
    queryFn: () => fetch("/api/jobs?limit=100").then(r => r.json()),
    staleTime: 60 * 1000,
  })

  const jobsList: any[] = jobsData?.jobs || []
  const openJobsCount = jobsList.filter(j => j.status === "OPEN" || j.status === "IN_PROGRESS").length
  const unassignedJobsCount = jobsList.filter(j => !j.assignedToId && j.status !== "CLOSED" && j.status !== "CANCELLED").length

  const firstName = user?.name?.split(" ")[0] || "Admin"
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const taskPieData = taskStats ? [
    { name: "To Do", value: taskStats.todo || 0 },
    { name: "In Progress", value: taskStats.inProgress || 0 },
    { name: "Completed", value: taskStats.completed || 0 },
    { name: "Blocked", value: taskStats.blocked || 0 },
  ].filter(d => d.value > 0) : []

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      
      {/* SECTION 1: SLEEK EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-slate-500">{formatDate(now)}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Live Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Here's what's happening across your team today. <span className="font-bold text-slate-700">{stats?.totalEmployees || 0} active employees</span> registered.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/recruitment/jobs"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Recruitment ({openJobsCount})</span>
          </Link>
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>Tasks</span>
          </Link>
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.97]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* SECTION 2: KPI CARDS (6 METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
        
        {/* Card 1: Total Employees */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Team</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={stats?.totalEmployees || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[10, 14, 18, 22, 25, 28, stats?.totalEmployees || 30]} color="#6366F1" height={24} />
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Present</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={stats?.presentToday || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[5, 8, 12, 16, 20, 22, stats?.presentToday || 24]} color="#10B981" height={24} />
          </div>
        </div>

        {/* Card 3: On Break */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">On Break</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Coffee className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={stats?.onBreakToday || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[2, 4, 3, 6, 4, 5, stats?.onBreakToday || 3]} color="#F59E0B" height={24} />
          </div>
        </div>

        {/* Card 4: Absent */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Absent</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <UserX className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={stats?.absentToday || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[4, 3, 5, 2, 3, 1, stats?.absentToday || 2]} color="#EF4444" height={24} />
          </div>
        </div>

        {/* Card 5: Pending Leaves */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Leaves</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={stats?.pendingLeaves || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[1, 3, 2, 4, 5, 3, stats?.pendingLeaves || 2]} color="#8B5CF6" height={24} />
          </div>
        </div>

        {/* Card 6: Tasks Due */}
        <div className="card p-5 hover-lift group border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tasks Due</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedNumber value={taskStats?.inProgress || 0} />
          </p>
          <div className="mt-3">
            <Sparkline data={[8, 12, 10, 15, 18, 14, taskStats?.inProgress || 12]} color="#3B82F6" height={24} />
          </div>
        </div>
      </div>

      {/* SECTION 3: TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3): Live Employee Status Table */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col border border-slate-200/80">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Team Status</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time attendance & activity monitoring</p>
            </div>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Login Time</th>
                  <th className="px-6 py-3 text-right">Work Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveStatus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No active attendance records recorded today
                    </td>
                  </tr>
                ) : (
                  liveStatus.slice(0, 7).map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusPill status={emp.status} />
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-600">
                        {emp.loginTime ? formatTime(emp.loginTime) : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                        {emp.hoursWorkedToday ? formatDuration(emp.hoursWorkedToday) : emp.workMinutes ? formatDuration(emp.workMinutes * 60) : "0m"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1/3): Activity Feed */}
        <div className="card p-6 flex flex-col border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Recent team events & pings</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {(!Array.isArray(activityFeed) || activityFeed.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">No recent activity</p>
            ) : (
              activityFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">{act.user?.name || "Employee"}</span> {act.description || act.action || "performed an action"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {act.time ? timeAgo(act.time) : act.createdAt ? timeAgo(act.createdAt) : "Just now"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Attendance Bar Chart (2/3) */}
        <div className="lg:col-span-2 card p-6 border border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Attendance Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Present vs absent overview this week</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />Present</span>
              <span className="flex items-center gap-1.5 text-rose-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Absent</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "12px" }}
                />
                <Bar dataKey="present" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="absent" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Donut Chart (1/3) */}
        <div className="card p-6 flex flex-col border border-slate-200/80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Task Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Distribution by status</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskPieData.length > 0 ? taskPieData : [{ name: "No tasks", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskPieData.map((_, idx) => (
                    <Cell key={idx} fill={TASK_COLORS[idx % TASK_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900">{taskStats?.total || 0}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Tasks</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            {taskPieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TASK_COLORS[idx % TASK_COLORS.length] }} />
                <span className="truncate">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/employees"
          className="card p-5 hover-lift group border border-slate-200/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Manage Team</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Directory & onboarding</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/attendance"
          className="card p-5 hover-lift group border border-slate-200/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Time Logs</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Attendance & pings</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/leaves"
          className="card p-5 hover-lift group border border-slate-200/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Leave Requests</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Review & approvals</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/tasks"
          className="card p-5 hover-lift group border border-slate-200/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition-colors">Task Board</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Projects & tracking</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

    </div>
  )
}
