"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PersonalInfoModal } from "@/components/admin/personal-info-modal"
import { AddressModal } from "@/components/admin/address-modal"
import { EmergencyContactModal } from "@/components/admin/emergency-contact-modal"
import { formatBloodGroup } from "@/components/shared/blood-group-select"
import { AssetTypeIcon } from "@/components/shared/asset-type-icon"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  Loader2, User, Mail, Briefcase, Calendar, Shield, Save, Lock, Edit2,
  KeyRound, Info, PhoneCall, MapPin, Package, AlertTriangle, MessageSquarePlus, Copy, ExternalLink
} from "lucide-react"
import { getInitials } from "@/lib/utils"

import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function EmployeeProfilePage() {
  const { user: authUser, updateSession } = useAuth()
  const queryClient = useQueryClient()
  
  // Modals for editing self-service sections
  const [showPersonalModal, setShowPersonalModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState("")
  const [savingName, setSavingName] = useState(false)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile")
      if (!res.ok) throw new Error("Failed to load profile")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const profile = profileData?.user

  const fetchProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] })
  }

  const handleSaveName = async () => {
    if (!editName || editName.length < 2) {
      toast.error("Please enter a valid name")
      return
    }

    setSavingName(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName })
      })
      if (res.ok) {
        toast.success("Name updated successfully")
        setIsEditingName(false)
        fetchProfile()
        updateSession()
      } else {
        toast.error("Failed to update name")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setSavingName(false)
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

  const handleReportAssetIssue = async (asset: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `IT Support: Issue with ${asset.assetName}`,
          description: `Employee reported an issue with asset ${asset.assetName} (Tag: ${asset.assetTag || "N/A"}, S/N: ${asset.serialNumber || "N/A"}). Please inspect.`,
          priority: "HIGH",
        }),
      })

      if (res.ok) {
        toast.success(`Support ticket logged for ${asset.assetName}! IT team notified.`)
      } else {
        toast.error("Failed to submit issue report")
      }
    } catch (e) {
      toast.error("Failed to report asset issue")
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!profile) return null

  const address = profile.address || {}
  const emergency = profile.emergencyContact || {}
  const activeAssets = (profile.assetsAssigned || []).filter((a: any) => !a.isReturned)

  const formatAddressString = (addrObj: any, isPermanent = false) => {
    const prefix = isPermanent ? "permanent" : "current"
    const street = addrObj[`${prefix}Street`]
    const city = addrObj[`${prefix}City`]
    const state = addrObj[`${prefix}State`]
    const zip = addrObj[`${prefix}ZipCode`]
    const country = addrObj[`${prefix}Country`] || "India"

    const parts = [street, city, state, zip, country].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : "No address recorded"
  }

  const currentAddressText = formatAddressString(address, false)
  const permanentAddressText = address.sameAsCurrent ? currentAddressText : formatAddressString(address, true)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="My Employee Profile"
        description="View and update your personal info, address, emergency contact, and view assigned assets"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - OVERVIEW */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-8 text-center relative overflow-hidden group">
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

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-[13px] uppercase tracking-wider">Employment Information</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <Mail className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Work Email</p>
                  <p className="text-[13px] font-semibold text-slate-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-[13px] font-medium text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{profile.employeeId}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Briefcase className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                  <p className="text-[13px] font-medium text-slate-900">{profile.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Join Date</p>
                  <p className="text-[13px] font-medium text-slate-900">{formatDate(profile.dateOfJoining)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SELF SERVICE TABS */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-white p-1 rounded-xl border border-slate-200/80 mb-4 h-auto flex-wrap">
              <TabsTrigger value="personal" className="text-xs py-2 px-3">Personal Info</TabsTrigger>
              <TabsTrigger value="address" className="text-xs py-2 px-3">Address</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs py-2 px-3">Emergency Contact</TabsTrigger>
              <TabsTrigger value="assets" className="text-xs py-2 px-3 relative">
                My Assets
                {activeAssets.length > 0 && (
                  <span className="ml-1.5 bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {activeAssets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs py-2 px-3">Security</TabsTrigger>
            </TabsList>

            {/* TAB 1: PERSONAL INFO */}
            <TabsContent value="personal" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                  <Button size="sm" onClick={() => setShowPersonalModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Personal Info
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Date of Birth</span>
                    <p className="font-bold text-slate-900">{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not Specified"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Gender</span>
                    <p className="font-bold text-slate-900">{profile.gender || "Not Specified"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Marital Status</span>
                    <p className="font-bold text-slate-900">{profile.maritalStatus || "Not Specified"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Blood Group</span>
                    <p className="font-bold text-rose-600">{formatBloodGroup(profile.bloodGroup)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Personal Email</span>
                    <p className="font-semibold text-slate-900">{profile.personalEmail || "Not Specified"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Alternate Phone</span>
                    <p className="font-semibold text-slate-900">{profile.alternatePhone || "Not Specified"}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase">Languages Known</span>
                    <p className="font-semibold text-slate-900">{profile.languagesKnown || "Not Specified"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ADDRESS */}
            <TabsContent value="address" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Address Details</h3>
                  <Button size="sm" onClick={() => setShowAddressModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Addresses
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-700">Current Address</h4>
                    <p className="text-xs text-slate-800 leading-relaxed">{currentAddressText}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-slate-700">Permanent Address</h4>
                      {address.sameAsCurrent && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Same as Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">{permanentAddressText}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: EMERGENCY CONTACT */}
            <TabsContent value="emergency" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Emergency Contact</h3>
                  <Button size="sm" onClick={() => setShowEmergencyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Emergency Contact
                  </Button>
                </div>

                {emergency.name ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{emergency.name}</h4>
                        <p className="text-xs text-indigo-600 font-semibold">{emergency.relationship}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-400 font-semibold block">Primary Phone</span>
                        <span className="font-bold text-slate-900 text-sm">{emergency.primaryPhone}</span>
                      </div>
                      {emergency.secondaryPhone && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-400 font-semibold block">Secondary Phone</span>
                          <span className="font-bold text-slate-900 text-sm">{emergency.secondaryPhone}</span>
                        </div>
                      )}
                    </div>

                    {emergency.notes && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <span className="font-bold">Medical Notes / Allergies:</span> {emergency.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">No emergency contact registered yet</p>
                    <Button size="sm" onClick={() => setShowEmergencyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                      + Add Emergency Contact
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: ASSIGNED ASSETS */}
            <TabsContent value="assets" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">My Assigned Assets</h3>
                    <p className="text-xs text-slate-500">Equipment assigned to you for work</p>
                  </div>
                </div>

                {activeAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeAssets.map((asset: any) => {
                      const isWarrantyExpiring = asset.warranty
                        ? new Date(asset.warranty).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000
                        : false

                      return (
                        <div key={asset.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl border border-slate-200 flex items-center justify-center">
                              <AssetTypeIcon type={asset.assetType} className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{asset.assetName}</h4>
                              <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                            </div>
                          </div>

                          {isWarrantyExpiring && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Warranty expiring within 30 days ({formatDate(asset.warranty)})
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400 block">Serial Number</span>
                              <span className="font-mono font-semibold text-slate-800">{asset.serialNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Asset Tag</span>
                              <span className="font-mono font-semibold text-slate-800">{asset.assetTag || "N/A"}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAssetIssue(asset)}
                            className="w-full text-xs bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                            Report Issue to IT
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No active equipment assigned to you</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: SECURITY */}
            <TabsContent value="security" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Change Account Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword} className="bg-slate-900 hover:bg-slate-800 text-white">
                    {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Personal Info Modal */}
      {showPersonalModal && (
        <PersonalInfoModal
          open={showPersonalModal}
          userId={profile.id}
          initialData={profile}
          onClose={() => setShowPersonalModal(false)}
          onSuccess={fetchProfile}
        />
      )}

      {/* Edit Address Modal */}
      {showAddressModal && (
        <AddressModal
          open={showAddressModal}
          userId={profile.id}
          initialData={address}
          onClose={() => setShowAddressModal(false)}
          onSuccess={fetchProfile}
        />
      )}

      {/* Edit Emergency Contact Modal */}
      {showEmergencyModal && (
        <EmergencyContactModal
          open={showEmergencyModal}
          userId={profile.id}
          initialData={emergency}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={fetchProfile}
        />
      )}
    </div>
  )
}
