"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, User, Mail, Briefcase, Calendar, Shield, Save, Lock, Edit2, KeyRound, Info } from "lucide-react"
import { getInitials, cn } from "@/lib/utils"

export default function EmployeeProfilePage() {
  const { user: authUser, updateSession } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
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
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and security settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - OVERVIEW */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-8 text-center relative overflow-hidden animate-fade-in group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 text-[32px] font-bold shadow-inner border border-indigo-200/50 ring-4 ring-white">
              {getInitials(profile.name)}
            </div>
            
            <h2 className="text-[20px] font-bold text-slate-900 mb-1">{profile.name}</h2>
            <p className="text-slate-500 text-[14px] font-medium mb-5">{profile.jobTitle}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-[12px] font-bold border border-indigo-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              {profile.department}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-[13px] uppercase tracking-wider">Contact Info</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-[14px] font-medium text-slate-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Employee ID</p>
                  <p className="text-[14px] font-medium text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded-md inline-block border border-slate-100">{profile.employeeId}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</p>
                  <p className="text-[14px] font-medium text-slate-900">{profile.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Join Date</p>
                  <p className="text-[14px] font-medium text-slate-900">
                    {new Date(profile.dateOfJoining).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SETTINGS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-indigo-50/30">
              <div>
                <h3 className="font-semibold text-slate-900 text-[15px]">Personal Information</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Update your display name</p>
              </div>
              {!isEditing ? (
                <button 
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-sm transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Info
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-sm transition-all"
                    onClick={() => {
                      setIsEditing(false)
                      setEditName(profile.name)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    onClick={handleSaveProfile} disabled={savingProfile}
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-slate-700">Full Name</Label>
                  {isEditing ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-[14px] shadow-sm focus-visible:ring-indigo-500"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200/60 text-[14px] font-medium text-slate-900 shadow-sm">
                      {profile.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-slate-700">Email Address</Label>
                  <div className="px-4 py-2.5 bg-slate-100/80 rounded-lg border border-slate-200/80 text-[14px] font-medium text-slate-500 cursor-not-allowed shadow-inner flex items-center justify-between">
                    {profile.email}
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Contact HR to change your email address
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-rose-50/30">
              <h3 className="font-semibold text-slate-900 text-[15px] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-500" />
                Change Password
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5 ml-6">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-slate-700">Current Password</Label>
                  <Input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-10 text-[14px] shadow-sm focus-visible:ring-rose-500"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-[13px] font-semibold text-slate-700">New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-10 text-[14px] shadow-sm focus-visible:ring-rose-500"
                    placeholder="Enter new password"
                  />
                  <p className="text-[11px] font-medium text-slate-400">Must be at least 8 characters long</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-slate-700">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-10 text-[14px] shadow-sm focus-visible:ring-rose-500"
                    placeholder="Confirm new password"
                  />
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
