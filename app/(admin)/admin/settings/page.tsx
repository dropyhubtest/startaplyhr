"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Building, Clock, Calendar, Building2, FileText, 
  Save, Loader2, Thermometer, Coffee, Wallet, Home, RefreshCw 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEPARTMENTS } from "@/lib/constants"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  
  const [departments, setDepartments] = useState<string[]>([])
  
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPage, setAuditPage] = useState(1)
  const [auditLoading, setAuditLoading] = useState(false)
  
  const [resetModal, setResetModal] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs(auditPage)
    }
  }, [activeTab, auditPage])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setFormData(data.settings)
      }
    } catch (e) {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/settings/departments")
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.departments)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAuditLogs = async (page: number) => {
    setAuditLoading(true)
    try {
      const res = await fetch(`/api/audit-logs?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs)
        setAuditTotal(data.total)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAuditLoading(false)
    }
  }

  const handleSave = async (tab: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        const data = await res.json()
        setFormData(data.settings)
        toast.success("Settings saved successfully!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleResetLeaves = async () => {
    setResetting(true)
    try {
      const res = await fetch("/api/settings/reset-leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: resetConfirmText })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        setResetModal(false)
        setResetConfirmText("")
      } else {
        toast.error(data.error || "Failed to reset leave balances")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        description="Configure your HR portal settings and system preferences"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-sm mb-6 flex overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-2 flex-1 justify-start border-0">
            <TabsTrigger value="company" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-5 py-2.5 font-medium text-[13px] transition-all gap-2">
              <Building className="w-4 h-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-5 py-2.5 font-medium text-[13px] transition-all gap-2">
              <Clock className="w-4 h-4" />
              Attendance Rules
            </TabsTrigger>
            <TabsTrigger value="leaves" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-5 py-2.5 font-medium text-[13px] transition-all gap-2">
              <Calendar className="w-4 h-4" />
              Leave Quotas
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-5 py-2.5 font-medium text-[13px] transition-all gap-2">
              <Building2 className="w-4 h-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-lg px-5 py-2.5 font-medium text-[13px] transition-all gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: COMPANY SETTINGS */}
        <TabsContent value="company" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900">Company Information</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Manage your core organization details</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Company Name</label>
                <Input
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Startaply"
                  className="h-10 text-[13px] shadow-sm border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Working Hours</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Start Time</span>
                    <Input
                      type="time"
                      value={formData.workStartTime || "09:00"}
                      onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                      className="h-10 text-[13px] shadow-sm border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">End Time</span>
                    <Input
                      type="time"
                      value={formData.workEndTime || "18:00"}
                      onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                      className="h-10 text-[13px] shadow-sm border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Working Days</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => (
                    <div key={day} className={cn(
                      "px-4 py-1.5 rounded-md text-[12px] font-bold border cursor-default shadow-sm",
                      i < 5 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                      {day}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-2">Monday to Friday (fixed system schedule)</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => handleSave("company")} 
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Company Settings
              </button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ATTENDANCE RULES */}
        <TabsContent value="attendance" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900">Attendance Rules</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Configure thresholds for late marks and overtime</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="pb-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[14px] font-semibold text-slate-900">Late Login Threshold</label>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Employee is marked late if they clock in after the work start time plus this many minutes.
                    </p>
                    <p className="text-[11px] bg-indigo-50 text-indigo-700 mt-2 font-bold px-2.5 py-1 rounded-md inline-block border border-indigo-100">
                      Currently: Employees late after {formData.workStartTime || "09:00"} + {formData.lateThresholdMinutes || 30} minutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.lateThresholdMinutes || 30}
                      onChange={(e) => setFormData({ ...formData, lateThresholdMinutes: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-slate-200"
                    />
                    <span className="text-[13px] font-medium text-slate-500">min</span>
                  </div>
                </div>
              </div>

              <div className="pb-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[14px] font-semibold text-slate-900">Maximum Break Duration</label>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Admin is notified when an employee exceeds this total break time in a day.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="15"
                      max="240"
                      value={formData.maxBreakMinutes || 60}
                      onChange={(e) => setFormData({ ...formData, maxBreakMinutes: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-slate-200"
                    />
                    <span className="text-[13px] font-medium text-slate-500">min</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[14px] font-semibold text-slate-900">Overtime Calculation</label>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Overtime is calculated after this many minutes of net work time in a day.
                    </p>
                    <p className="text-[11px] bg-indigo-50 text-indigo-700 mt-2 font-bold px-2.5 py-1 rounded-md inline-block border border-indigo-100">
                      Currently: {Math.floor((formData.overtimeAfterMinutes || 540) / 60)}h {(formData.overtimeAfterMinutes || 540) % 60}m
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="240"
                      max="720"
                      value={formData.overtimeAfterMinutes || 540}
                      onChange={(e) => setFormData({ ...formData, overtimeAfterMinutes: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-slate-200"
                    />
                    <span className="text-[13px] font-medium text-slate-500">min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => handleSave("attendance")} 
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Attendance Rules
              </button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: LEAVE QUOTAS */}
        <TabsContent value="leaves" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900">Default Leave Quotas</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Applied to new employees by default</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    <label className="text-[13px] font-bold text-rose-900">Sick Leave</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.defaultSickLeave || 10}
                      onChange={(e) => setFormData({ ...formData, defaultSickLeave: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-rose-200 bg-white focus-visible:ring-rose-500"
                    />
                    <span className="text-[12px] font-medium text-rose-600">days/year</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-4 h-4 text-blue-500" />
                    <label className="text-[13px] font-bold text-blue-900">Casual Leave</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="365"
                      value={formData.defaultCasualLeave || 12}
                      onChange={(e) => setFormData({ ...formData, defaultCasualLeave: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-blue-200 bg-white focus-visible:ring-blue-500"
                    />
                    <span className="text-[12px] font-medium text-blue-600">days/year</span>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <label className="text-[13px] font-bold text-emerald-900">Paid Leave</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="365"
                      value={formData.defaultPaidLeave || 15}
                      onChange={(e) => setFormData({ ...formData, defaultPaidLeave: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-emerald-200 bg-white focus-visible:ring-emerald-500"
                    />
                    <span className="text-[12px] font-medium text-emerald-600">days/year</span>
                  </div>
                </div>

                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-purple-500" />
                    <label className="text-[13px] font-bold text-purple-900">Work From Home</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="365"
                      value={formData.defaultWFHLeave || 24}
                      onChange={(e) => setFormData({ ...formData, defaultWFHLeave: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center text-[13px] shadow-sm border-purple-200 bg-white focus-visible:ring-purple-500"
                    />
                    <span className="text-[12px] font-medium text-purple-600">days/year</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mb-8">
                <button 
                  onClick={() => handleSave("leaves")} 
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Quota Settings
                </button>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-[13px] font-bold text-rose-600 uppercase tracking-wider mb-3">Danger Zone</h4>
                <div className="bg-rose-50/30 border border-rose-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-semibold text-rose-900">Reset All Leave Balances</p>
                      <p className="text-[13px] text-rose-700/80 mt-1 leading-relaxed">
                        This will reset all used leave counts to 0 for all employees and apply the current default quotas. This cannot be undone.
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-semibold shadow-sm transition-all flex-shrink-0"
                      onClick={() => setResetModal(true)}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Balances
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Dialog open={resetModal} onOpenChange={setResetModal}>
              <DialogContent className="max-w-sm border-slate-200 p-0 overflow-hidden rounded-xl">
                <div className="px-6 pt-6 pb-4">
                  <DialogHeader>
                    <DialogTitle className="text-[18px] font-semibold text-rose-600 flex items-center gap-2">
                      <Thermometer className="w-5 h-5" />
                      Reset All Leave Balances?
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 mt-2 text-[13px] leading-relaxed">
                      This will reset the used leave count for ALL employees to zero. This action cannot be undone.
                      <br /><br />
                      Type <strong className="text-rose-600 font-bold">RESET</strong> below to confirm:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <Input
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                      placeholder="Type RESET to confirm"
                      className="h-10 text-[13px] border-slate-200 focus-visible:ring-rose-500 font-mono text-center shadow-sm"
                    />
                  </div>
                </div>
                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => { setResetModal(false); setResetConfirmText("") }}
                    className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    disabled={resetConfirmText !== "RESET" || resetting}
                    onClick={handleResetLeaves}
                  >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Yes, Reset
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </TabsContent>

        {/* TAB 4: DEPARTMENTS */}
        <TabsContent value="departments" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900">Departments</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Departments currently in use</p>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-8">
                {departments.map(dept => (
                  <div key={dept} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg px-3 py-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[13px] font-bold text-indigo-700">{dept}</span>
                  </div>
                ))}
                {departments.length === 0 && <p className="text-[13px] text-slate-500 font-medium">No departments in use yet.</p>}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 mb-3 font-bold uppercase tracking-wider">
                  All available system departments
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(dept => (
                    <span key={dept} className={cn(
                      "text-[12px] px-2.5 py-1 rounded-md border font-bold shadow-sm",
                      departments.includes(dept)
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    )}>
                      {dept}
                      {departments.includes(dept) && " ✓"}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-4 font-medium">Green = Department has employees assigned</p>
              </div>

              <div className="mt-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <span className="text-[16px] leading-none">ℹ️</span>
                </div>
                <p className="text-[13px] text-blue-900 leading-relaxed font-medium mt-1">
                  Departments are managed through employee profiles. To add a new department, simply assign it from the available list when creating or editing an employee.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: AUDIT LOG */}
        <TabsContent value="audit" className="mt-0 outline-none animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Audit Log</h3>
              <span className="text-[12px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                {auditTotal} entries
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="uppercase tracking-wider text-[11px] font-medium text-slate-500 px-6 py-3">User</th>
                    <th className="uppercase tracking-wider text-[11px] font-medium text-slate-500 px-6 py-3">Action</th>
                    <th className="uppercase tracking-wider text-[11px] font-medium text-slate-500 px-6 py-3">Details</th>
                    <th className="uppercase tracking-wider text-[11px] font-medium text-slate-500 px-6 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-[13px] font-medium text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-[13px] font-bold text-slate-900">{log.user?.name || "System"}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{log.user?.employeeId || "-"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide uppercase border shadow-sm",
                            log.action.includes("CREATED") && "bg-emerald-50 border-emerald-200 text-emerald-700",
                            log.action.includes("UPDATED") && "bg-blue-50 border-blue-200 text-blue-700",
                            (log.action.includes("DELETED") || log.action.includes("DEACTIVATED")) && "bg-rose-50 border-rose-200 text-rose-700",
                            log.action.includes("APPROVED") && "bg-emerald-50 border-emerald-200 text-emerald-700",
                            log.action.includes("REJECTED") && "bg-rose-50 border-rose-200 text-rose-700",
                            log.action.includes("CLOCK") && "bg-indigo-50 border-indigo-200 text-indigo-700",
                            !["CREATED", "UPDATED", "DELETED", "DEACTIVATED", "APPROVED", "REJECTED", "CLOCK"].some(v => log.action.includes(v)) && "bg-slate-50 border-slate-200 text-slate-600"
                          )}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] text-slate-600 max-w-sm truncate" title={log.details || ""}>
                            {log.details || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-[12px] font-medium text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[12px] font-medium text-slate-500">
                Showing <span className="text-slate-900 font-bold">{auditLogs.length > 0 ? (auditPage - 1) * 20 + 1 : 0}</span> to <span className="text-slate-900 font-bold">{Math.min(auditPage * 20, auditTotal)}</span> of <span className="text-slate-900 font-bold">{auditTotal}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={auditPage === 1 || auditLoading}
                  onClick={() => setAuditPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={auditPage * 20 >= auditTotal || auditLoading}
                  onClick={() => setAuditPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
