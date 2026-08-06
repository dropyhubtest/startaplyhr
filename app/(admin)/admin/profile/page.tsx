"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, User, Mail, Briefcase, Calendar, Shield, Save, Lock, LayoutGrid, Users, Megaphone } from "lucide-react"
import { getInitials, cn } from "@/lib/utils"

export default function AdminProfilePage() {
  const { user: authUser, updateSession } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [stats, setStats] = useState({ employees: 0, tasks: 0, announcements: 0 })

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (res.ok) {
        setProfile(data.user)
        setEditName(data.user.name)
      }
    } catch (e) {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [empRes, tasksRes, annRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/tasks"),
        fetch("/api/announcements")
      ])
      
      const empData = empRes.ok ? await empRes.json() : { employees: [] }
      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] }
      const annData = annRes.ok ? await annRes.json() : { announcements: [] }

      setStats({
        employees: empData.employees?.length || 0,
        tasks: tasksData.tasks?.length || 0,
        announcements: annData.announcements?.length || 0,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName || editName.length < 2) {
      toast.error("Please enter a valid name")
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName })
      })
      if (res.ok) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
        fetchProfile()
        updateSession()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Admin Profile"
        description="Manage your administrator account settings and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - OVERVIEW */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-8 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-10" />
            
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-[32px] font-bold shadow-lg shadow-indigo-500/30 relative z-10 border-4 border-white">
              {getInitials(profile.name)}
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 mb-1 leading-tight">{profile.name}</h2>
            <p className="text-slate-500 text-[13px] font-medium mb-5">{profile.jobTitle || "System Administrator"}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Super Admin
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-[14px]">Contact Info</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-[13px] font-semibold text-slate-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Employee ID</p>
                  <p className="text-[13px] font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">{profile.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</p>
                  <p className="text-[13px] font-semibold text-slate-900">{profile.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Member Since</p>
                  <p className="text-[13px] font-semibold text-slate-900">
                    {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SETTINGS & STATS */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-12 h-12 text-indigo-500" />
              </div>
              <span className="text-[28px] font-bold text-slate-900 leading-none relative z-10">{stats.employees}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2 relative z-10">Active Employees</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <LayoutGrid className="w-12 h-12 text-blue-500" />
              </div>
              <span className="text-[28px] font-bold text-slate-900 leading-none relative z-10">{stats.tasks}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2 relative z-10">Total Tasks</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Megaphone className="w-12 h-12 text-emerald-500" />
              </div>
              <span className="text-[28px] font-bold text-slate-900 leading-none relative z-10">{stats.announcements}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2 relative z-10">Announcements</span>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Personal Information</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Update your display name</p>
              </div>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-medium text-slate-700 shadow-sm transition-all"
                >
                  Edit Info
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setEditName(profile.name) }}
                    className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-medium text-slate-700 shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Full Name</label>
                  {isEditing ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-[13px] border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                    />
                  ) : (
                    <div className="h-10 px-3 flex items-center bg-slate-50/50 rounded-md border border-slate-200 text-[13px] font-medium text-slate-900 shadow-sm">
                      {profile.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Email Address</label>
                  <div className="h-10 px-3 flex items-center bg-slate-100 rounded-md border border-slate-200 text-[13px] font-medium text-slate-500 cursor-not-allowed shadow-sm">
                    {profile.email}
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Admin email cannot be changed here.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-rose-50/30">
              <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                Change Password
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5 ml-6">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Current Password</label>
                  <Input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-10 text-[13px] border-slate-200 focus-visible:ring-indigo-500 shadow-sm bg-slate-50/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">New Password</label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-10 text-[13px] border-slate-200 focus-visible:ring-indigo-500 shadow-sm bg-slate-50/50"
                  />
                  <p className="text-[11px] font-medium text-slate-400">Must be at least 8 characters long</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Confirm New Password</label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={cn(
                      "h-10 text-[13px] border-slate-200 focus-visible:ring-indigo-500 shadow-sm bg-slate-50/50",
                      confirmPassword && newPassword !== confirmPassword && "border-rose-300 focus-visible:ring-rose-500 bg-rose-50"
                    )}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium shadow-md transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
