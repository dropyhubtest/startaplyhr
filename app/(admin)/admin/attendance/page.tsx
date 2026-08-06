"use client"

import { useState, useEffect, useCallback } from "react"
import { getInitials, formatDate, formatTime, formatDuration } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatsCard } from "@/components/shared/stats-card"
import { AttendanceCorrectionModal } from "@/components/admin/attendance-correction-modal"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Search, Clock, Users, ArrowRightLeft, FileEdit, Coffee, UserCheck, UserX, AlertCircle 
} from "lucide-react"

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState("today")
  
  // Today Tab State
  const [todayData, setTodayData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loadingToday, setLoadingToday] = useState(true)
  const [searchToday, setSearchToday] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])
  
  const [correctingLog, setCorrectingLog] = useState<any>(null)

  const fetchTodayData = useCallback(async () => {
    setLoadingToday(true)
    try {
      const res = await fetch(`/api/attendance/admin/today?date=${selectedDate}`)
      const data = await res.json()
      if (res.ok) {
        setTodayData(data.employees || [])
        setSummary(data.summary)
      }
    } catch (error) {
      toast.error("Failed to load attendance")
    } finally {
      setLoadingToday(false)
    }
  }, [selectedDate])

  useEffect(() => {
    if (activeTab === "today") {
      fetchTodayData()
    }
  }, [activeTab, fetchTodayData])

  const filteredToday = todayData.filter(emp => 
    emp.name.toLowerCase().includes(searchToday.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(searchToday.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchToday.toLowerCase())
  )

  // History Tab State
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [historyEndDate, setHistoryEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [historyData, setHistoryData] = useState<any[]>([])
  const [historyWorkingDays, setHistoryWorkingDays] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [viewingLogsFor, setViewingLogsFor] = useState<any>(null)
  
  const fetchHistoryData = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/attendance/admin/history?startDate=${historyStartDate}&endDate=${historyEndDate}`)
      const data = await res.json()
      if (res.ok) {
        setHistoryData(data.summary || [])
        setHistoryWorkingDays(data.totalWorkingDays || 0)
      } else {
        toast.error(data.error || "Failed to load history")
      }
    } catch (error) {
      toast.error("Failed to load history")
    } finally {
      setLoadingHistory(false)
    }
  }, [historyStartDate, historyEndDate])

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryData()
    }
  }, [activeTab, fetchHistoryData])

  const handleOverride = async (dateStr: string, isWorkingDay: boolean) => {
    try {
      const res = await fetch("/api/attendance/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, isWorkingDay })
      })
      if (res.ok) {
        toast.success("Working day override applied!")
        fetchHistoryData() // Refresh the view
      } else {
        toast.error("Failed to apply override")
      }
    } catch (e) {
      toast.error("Failed to apply override")
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Monitor and manage employee time and attendance"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-sm mb-6 flex overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-2 flex-1 justify-start border-0">
            <TabsTrigger 
              value="today" 
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all"
            >
              Today's Overview
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all"
            >
              Date Range History
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-6 py-2.5 font-medium text-[13px] transition-all"
            >
              Export Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="mt-0 outline-none space-y-6 animate-fade-in">
          
          {loadingToday ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200/70 p-4 h-[104px] animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatsCard title="Total Active" value={todayData?.length || 0} icon={Users} color="indigo" />
              <StatsCard title="Present" value={summary.present} icon={UserCheck} color="emerald" />
              <StatsCard title="On Break" value={summary.onBreak} icon={Coffee} color="amber" />
              <StatsCard title="Late" value={summary.late} icon={AlertCircle} color="amber" />
              <StatsCard title="Absent/Leave" value={summary.absent + summary.onLeave} icon={UserX} color="rose" />
            </div>
          ) : null}

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Today's Logs</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Real-time attendance tracking</p>
              </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-[13px] bg-white"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchToday}
                  onChange={(e) => setSearchToday(e.target.value)}
                  className="pl-9 h-9 border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-[13px] bg-white"
                />
              </div>
            </div>
          </div>
            
          <div className="overflow-x-auto flex-1">
              {loadingToday ? (
                <div className="p-4"><TableSkeleton cols={8} rows={5} /></div>
              ) : filteredToday.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-[15px] font-medium text-slate-900 mb-1">No records found</h3>
                  <p className="text-[13px] text-slate-500">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Department</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Status</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Login</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Logout</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Breaks</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Net Work</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredToday.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[12px] font-bold text-indigo-700">
                                {getInitials(emp.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-[13px] leading-snug">{emp.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12.5px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/60">
                            {emp.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={emp.status} size="sm" />
                            {emp.isLate && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">Late</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 text-[13px]">
                          {emp.loginTime ? formatTime(emp.loginTime) : '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 text-[13px]">
                          {emp.logoutTime ? formatTime(emp.logoutTime) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 text-[13px] font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
                            <Coffee className="w-3.5 h-3.5 text-slate-400" />
                            {emp.totalBreakMinutes > 0 ? `${emp.totalBreakMinutes}m` : '0m'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 text-[13px]">
                            {formatDuration(emp.netWorkMinutes)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-medium text-indigo-600 shadow-sm transition-all active:scale-[0.98]"
                            onClick={() => {
                              if (emp.log) {
                                setCorrectingLog({ ...emp.log, user: { name: emp.name } })
                              } else {
                                toast.error("No attendance log to correct for this employee today.")
                              }
                            }}
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            Correct
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">30-Day Summary</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Aggregate attendance over a date range. Total Working Days: {historyWorkingDays}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-slate-600">From</span>
                  <Input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="h-9 w-40 text-[13px] bg-white border-slate-200" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-slate-600">To</span>
                  <Input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="h-9 w-40 text-[13px] bg-white border-slate-200" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
              <span className="text-[13px] font-semibold text-slate-700">Weekend Overrides:</span>
              <Input type="date" id="overrideDate" className="h-8 w-40 text-[12px] bg-white" />
              <button onClick={() => {
                const el = document.getElementById('overrideDate') as HTMLInputElement
                if(el.value) handleOverride(el.value, true)
              }} className="h-8 px-3 text-[12px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
                Mark as Working Day
              </button>
              <button onClick={() => {
                const el = document.getElementById('overrideDate') as HTMLInputElement
                if(el.value) handleOverride(el.value, false)
              }} className="h-8 px-3 text-[12px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors">
                Mark as Holiday
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loadingHistory ? (
                <div className="p-4"><TableSkeleton cols={7} rows={5} /></div>
              ) : historyData.length === 0 ? (
                <div className="p-16 text-center text-slate-500">No history found for this range.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Department</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Present</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Absent</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Late</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3">Avg Hours</th>
                      <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[12px] font-bold text-indigo-700">{getInitials(emp.name)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-[13px]">{emp.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-slate-600">{emp.department}</td>
                        <td className="px-6 py-4 text-[13px] font-semibold text-emerald-600">{emp.stats.present}</td>
                        <td className="px-6 py-4 text-[13px] font-semibold text-rose-600">{emp.stats.absent}</td>
                        <td className="px-6 py-4 text-[13px] font-semibold text-amber-600">{emp.stats.late}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-slate-700">{formatDuration(emp.stats.avgMinutes)}/day</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setViewingLogsFor(emp)}
                            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-0 outline-none p-16 text-center bg-white rounded-xl border border-slate-200/70 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <FileEdit className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-1">Export Reports</h3>
          <p className="text-[13px] text-slate-500">CSV/Excel exporting will be implemented in the next phase.</p>
        </TabsContent>
      </Tabs>

      {correctingLog && (
        <AttendanceCorrectionModal
          open={!!correctingLog}
          log={correctingLog}
          onClose={() => setCorrectingLog(null)}
          onSuccess={fetchTodayData}
        />
      )}

      {viewingLogsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">{viewingLogsFor.name}'s Logs</h3>
                <p className="text-[13px] text-slate-500">Detailed attendance history</p>
              </div>
              <button onClick={() => setViewingLogsFor(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <Users className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Login</th>
                    <th className="px-6 py-3">Logout</th>
                    <th className="px-6 py-3">Net Work</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingLogsFor.logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No logs found.</td></tr>
                  ) : viewingLogsFor.logs.map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-700">{formatDate(log.date)}</td>
                      <td className="px-6 py-3">{log.loginTime ? formatTime(log.loginTime) : '—'}</td>
                      <td className="px-6 py-3">{log.logoutTime ? formatTime(log.logoutTime) : '—'}</td>
                      <td className="px-6 py-3 font-medium">{formatDuration(log.netWorkMinutes || 0)}</td>
                      <td className="px-6 py-3">
                        {log.isLate ? <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold uppercase">Late</span>
                                    : <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase">Present</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setViewingLogsFor(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium shadow-sm hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
