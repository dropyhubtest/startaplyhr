"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { StatsCard } from "@/components/shared/stats-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { BarChart3, Loader2, Download, Clock, TrendingUp, Users, Calendar, CalendarRange, Filter, Award, AlertCircle } from "lucide-react"
import { cn, formatDuration, formatTime } from "@/lib/utils"
import { 
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts"

const CHART_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("attendance")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const [employees, setEmployees] = useState<any[]>([])
  
  const [attendanceReport, setAttendanceReport] = useState<any>(null)
  const [workHoursReport, setWorkHoursReport] = useState<any>(null)
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [exporting, setExporting] = useState(false)

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]

  useEffect(() => {
    fetch("/api/employees?limit=100")
      .then(res => res.json())
      .then(data => {
        if (data.employees) setEmployees(data.employees)
      })
  }, [])

  const generateReport = async () => {
    setLoading(true)
    setGenerated(false)
    try {
      const params = new URLSearchParams({
        month: String(selectedMonth),
        year: String(selectedYear),
      })
      if (activeTab === "attendance") {
        params.append("employeeId", selectedEmployee)
        const res = await fetch(`/api/reports/attendance?${params}`)
        if (!res.ok) throw new Error()
        setAttendanceReport(await res.json())
      } else if (activeTab === "work-hours") {
        const res = await fetch(`/api/reports/work-hours?${params}`)
        if (!res.ok) throw new Error()
        setWorkHoursReport(await res.json())
      } else if (activeTab === "performance") {
        const res = await fetch(`/api/reports/performance?${params}`)
        if (!res.ok) throw new Error()
        setPerformanceReport(await res.json())
      }
      setGenerated(true)
      toast.success("Report generated successfully")
    } catch (e) {
      toast.error("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    const params = new URLSearchParams({
      type: activeTab,
      month: String(selectedMonth),
      year: String(selectedYear),
      employeeId: selectedEmployee,
    })
    window.location.href = `/api/reports/export?${params}`
    setTimeout(() => setExporting(false), 2000)
    toast.success("Download started!")
  }

  // Handle Tab Change
  useEffect(() => {
    setGenerated(false)
  }, [activeTab, selectedMonth, selectedYear, selectedEmployee])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 
            tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Generate detailed insights and export reports 
            for your team
          </p>
        </div>
      </div>
  
      {/* Tabs - Beautiful custom design */}
      <div className="bg-white border border-slate-200/70 
        rounded-xl p-1.5 inline-flex gap-1 shadow-sm">
        {[
          { id: "attendance", label: "Attendance", 
            icon: Users },
          { id: "work-hours", label: "Work Hours", 
            icon: Clock },
          { id: "performance", label: "Performance", 
            icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg " +
              "text-[13px] font-medium transition-all",
              activeTab === tab.id
                ? "bg-gradient-to-b from-indigo-50 to-blue-50 " +
                  "text-indigo-700 shadow-sm border " +
                  "border-indigo-100"
                : "text-slate-600 hover:bg-slate-50 " +
                  "hover:text-slate-900"
            )}
          >
            <tab.icon className={cn(
              "w-4 h-4",
              activeTab === tab.id ? "text-indigo-600" : 
                "text-slate-400"
            )} />
            {tab.label}
          </button>
        ))}
      </div>
  
      {/* Filter Card - Beautiful design */}
      <div className="bg-white border border-slate-200/70 
        rounded-xl overflow-hidden shadow-sm">
        
        {/* Header with gradient */}
        <div className="px-6 py-4 border-b border-slate-100 
          bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg 
              bg-gradient-to-br from-indigo-500 to-blue-600
              flex items-center justify-center 
              shadow-sm shadow-indigo-500/20">
              <Filter className="w-4 h-4 text-white" 
                strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold 
                text-slate-900">
                Report parameters
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Configure filters to generate your report
              </p>
            </div>
          </div>
        </div>
  
        {/* Filters grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 
            gap-4 mb-5">
            
            {/* Employee filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium 
                text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Employee
              </label>
              <Select value={selectedEmployee} 
                onValueChange={(val) => setSelectedEmployee(val || "all")}>
                <SelectTrigger className="h-10 bg-white 
                  border-slate-200 hover:border-slate-300 
                  focus:border-indigo-500 
                  focus:ring-2 focus:ring-indigo-500/10 
                  text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border 
                  border-slate-200 shadow-lg rounded-lg">
                  <SelectItem value="all">
                    All Employees
                  </SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            {/* Month filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium 
                text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 
                  text-slate-400" />
                Month
              </label>
              <Select value={String(selectedMonth)} 
                onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="h-10 bg-white 
                  border-slate-200 hover:border-slate-300 
                  focus:border-indigo-500 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border 
                  border-slate-200 shadow-lg rounded-lg">
                  {monthNames.map((name, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            {/* Year filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium 
                text-slate-700 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 
                  text-slate-400" />
                Year
              </label>
              <Select value={String(selectedYear)} 
                onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="h-10 bg-white 
                  border-slate-200 hover:border-slate-300 
                  focus:border-indigo-500 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border 
                  border-slate-200 shadow-lg rounded-lg">
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
  
          {/* Action buttons */}
          <div className="flex items-center gap-3 
            pt-4 border-t border-slate-100">
            <button
              onClick={generateReport}
              disabled={loading}
              className="inline-flex items-center gap-2 h-10 
                px-5 rounded-lg 
                bg-gradient-to-r from-indigo-600 to-blue-600 
                hover:from-indigo-700 hover:to-blue-700
                text-white text-[13px] font-medium 
                shadow-md shadow-indigo-500/25 
                hover:shadow-lg hover:shadow-indigo-500/30
                transition-all active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Generate Report
            </button>
            
            {generated && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 h-10 
                  px-4 rounded-lg 
                  bg-white border border-slate-200 
                  hover:bg-slate-50 hover:border-slate-300
                  text-slate-700 text-[13px] font-medium 
                  shadow-sm transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>
  
      {/* Results Section */}
      {!generated ? (
        /* Empty state */
        <div className="bg-white border border-slate-200/70 
          rounded-xl p-16 shadow-sm">
          <div className="max-w-sm mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl 
              bg-gradient-to-br from-indigo-50 to-blue-50
              border border-indigo-100 flex items-center 
              justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7 text-indigo-600" 
                strokeWidth={1.75} />
            </div>
            <h3 className="text-[16px] font-semibold 
              text-slate-900 mb-1">
              No report generated yet
            </h3>
            <p className="text-[13px] text-slate-500 
              leading-relaxed">
              Configure your parameters above and click 
              "Generate Report" to see detailed analytics.
            </p>
          </div>
        </div>
      ) : (
        /* Report content based on active tab */
        <div className="space-y-6 animate-fade-in">
          {activeTab === "attendance" && attendanceReport && (
            <AttendanceReportView data={attendanceReport} />
          )}
          {activeTab === "work-hours" && workHoursReport && (
            <WorkHoursReportView data={workHoursReport} />
          )}
          {activeTab === "performance" && performanceReport && (
            <PerformanceReportView data={performanceReport} />
          )}
        </div>
      )}
    </div>
  )
}

function AttendanceReportView({ data }: { data: any }) {
  if (data.type === "all") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
            <h3 className="text-[15px] font-semibold text-slate-900">Team Attendance Summary</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Monthly attendance statistics across all employees</p>
          </div>
          <div className="p-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Employee</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Present</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Absent</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Late</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Leave</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employeeSummaries.map((s: any) => (
                  <tr key={s.employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.employee.name}</td>
                    <td className="px-4 py-3 text-center">{s.present}</td>
                    <td className="px-4 py-3 text-center">{s.absent}</td>
                    <td className="px-4 py-3 text-center">{s.late}</td>
                    <td className="px-4 py-3 text-center">{s.leave}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[11px] font-bold",
                        s.attendanceRate >= 80 ? "bg-emerald-50 text-emerald-700" :
                        s.attendanceRate >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                      )}>
                        {s.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Individual Report
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <h3 className="text-[15px] font-semibold text-slate-900">{data.employee.name}</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">{data.employee.department} • {data.employee.jobTitle}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatsCard title="Present" value={data.summary.present} color="emerald" />
            <StatsCard title="Absent" value={data.summary.absent} color="rose" />
            <StatsCard title="Late" value={data.summary.late} color="amber" />
            <StatsCard title="Leave" value={data.summary.leave} color="indigo" />
            <StatsCard title="Total Hours" value={(data.summary.totalMinutes / 60).toFixed(1)} color="blue" />
            <StatsCard title="Overtime" value={(data.summary.totalOvertimeMinutes / 60).toFixed(1)} color="purple" />
          </div>

          <table className="w-full text-left text-sm mt-4 border border-slate-100 rounded-lg overflow-hidden">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Login</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Logout</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Work Hours</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Break</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.dailyLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{log.loginTime ? formatTime(log.loginTime) : '-'}</td>
                  <td className="px-4 py-3">{log.logoutTime ? formatTime(log.logoutTime) : '-'}</td>
                  <td className="px-4 py-3">{formatDuration(log.netWorkMinutes)}</td>
                  <td className="px-4 py-3">{formatDuration(log.totalBreakMinutes)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                      {log.status}
                    </span>
                    {log.isLate && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">LATE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function WorkHoursReportView({ data }: { data: any }) {
  const chartData = data.report.map((r: any) => ({
    name: (r.employee?.name || "").split(" ")[0],
    hours: r.totalHours,
    overtime: Math.round(r.totalOvertimeMinutes / 60 * 10) / 10,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Team Hours"
          value={`${(data.teamStats.totalMinutes/60).toFixed(0)}h`}
          color="indigo" />
        <StatsCard 
          title="Team Average"
          value={`${(data.teamStats.avgMinutesPerEmployee/60).toFixed(1)}h`}
          color="blue" />
        <StatsCard 
          title="Top Performer"
          value={data.teamStats.highestHours?.employee.name || "-"}
          color="emerald" />
        <StatsCard
          title="Needs Attention"
          value={data.teamStats.lowestHours?.employee.name || "-"}
          color="amber" />
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <h3 className="text-[15px] font-semibold text-slate-900">Work Hours Breakdown</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">Regular vs overtime hours per employee</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => `${v}h`} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(v) => `${v}h`} 
              />
              <Legend iconType="circle" />
              <Bar dataKey="hours" name="Work Hours" fill="#6366F1" radius={[0,4,4,0]} />
              <Bar dataKey="overtime" name="Overtime" fill="#22C55E" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Employee</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Total Hours</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Avg/Day</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Overtime</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Late Arrivals</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Avg Login</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Avg Logout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.report.map((r: any) => (
                <tr key={r.employee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.employee.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600">{r.totalHours}h</td>
                  <td className="px-4 py-3 text-right">{(r.avgMinutesPerDay / 60).toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{(r.totalOvertimeMinutes / 60).toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center">{r.lateArrivals}</td>
                  <td className="px-4 py-3 text-center">{r.avgLoginTime}</td>
                  <td className="px-4 py-3 text-center">{r.avgLogoutTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PerformanceReportView({ data }: { data: any }) {
  const radarData = data.performanceData ? [
    { 
      metric: "Attendance", 
      ...Object.fromEntries(data.performanceData.map((p: any) => [(p.employee?.name || "").split(" ")[0], p.attendanceScore]))
    },
    { 
      metric: "Completion", 
      ...Object.fromEntries(data.performanceData.map((p: any) => [(p.employee?.name || "").split(" ")[0], p.completionRate]))
    },
    { 
      metric: "On-Time", 
      ...Object.fromEntries(data.performanceData.map((p: any) => [(p.employee?.name || "").split(" ")[0], p.onTimeRate]))
    },
  ] : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.performanceData.slice(0,3).map((p: any, i: number) => (
          <div key={p.employee.id} className={cn(
            "bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 text-center relative overflow-hidden",
            i === 0 && "border-yellow-200",
            i === 1 && "border-slate-200",
            i === 2 && "border-orange-200",
          )}>
            <div className={cn(
              "absolute top-0 left-0 w-full h-1",
              i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : "bg-orange-400"
            )} />
            <div className="text-3xl mb-2 mt-2">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
            </div>
            <p className="font-bold text-slate-900">{p.employee.name}</p>
            <p className="text-[12px] text-slate-500">{p.employee.department}</p>
            <div className={cn(
              "text-2xl font-bold mt-3",
              p.overallScore >= 90 ? "text-emerald-600" :
              p.overallScore >= 75 ? "text-indigo-600" :
              p.overallScore >= 60 ? "text-amber-600" : "text-rose-600"
            )}>
              {p.overallScore}
            </div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-1">Overall Score</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <h3 className="text-[15px] font-semibold text-slate-900">Team Performance Matrix</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">Multi-dimensional view of employee metrics</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
              {data.performanceData.slice(0, 5).map((p: any, i: number) => (
                <Radar
                  key={p.employee.id}
                  name={(p.employee?.name || "").split(" ")[0]}
                  dataKey={(p.employee?.name || "").split(" ")[0]}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend iconType="circle" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Employee</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Attendance %</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Tasks</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Completed</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Completion %</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">On-Time %</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Score</th>
                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.performanceData.map((p: any) => (
                <tr key={p.employee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.employee.name}</td>
                  <td className="px-4 py-3 text-center">{p.attendanceScore}%</td>
                  <td className="px-4 py-3 text-center text-slate-500">{p.tasksAssigned}</td>
                  <td className="px-4 py-3 text-center text-indigo-600 font-medium">{p.tasksCompleted}</td>
                  <td className="px-4 py-3 text-center">{p.completionRate}%</td>
                  <td className="px-4 py-3 text-center">{p.onTimeRate}%</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">{p.overallScore}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-bold shadow-sm border",
                      p.grade === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      p.grade === "B" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                      p.grade === "C" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {p.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
