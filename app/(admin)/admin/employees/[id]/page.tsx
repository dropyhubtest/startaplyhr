"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getInitials, formatDate, formatDuration } from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal"
import { PersonalInfoModal } from "@/components/admin/personal-info-modal"
import { AddressModal } from "@/components/admin/address-modal"
import { EmergencyContactModal } from "@/components/admin/emergency-contact-modal"
import { AssignAssetModal } from "@/components/admin/assign-asset-modal"
import { ReturnAssetModal } from "@/components/admin/return-asset-modal"
import { formatBloodGroup } from "@/components/shared/blood-group-select"
import { AssetTypeIcon, getAssetTypeDetails } from "@/components/shared/asset-type-icon"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, Mail, Phone, Building, CalendarDays, IndianRupee, 
  Pencil, Power, ChevronLeft, ChevronRight, Activity, CalendarCheck, 
  FileCheck, Calendar as CalendarIcon, User, MapPin, PhoneCall, Package,
  ExternalLink, Copy, Check, RotateCcw, AlertTriangle, ShieldAlert
} from "lucide-react"
import { toast } from "sonner"
import { isBefore, isWeekend } from "date-fns"

export default function EmployeeDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)
  const [showPersonalModal, setShowPersonalModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showAssignAssetModal, setShowAssignAssetModal] = useState(false)
  const [selectedReturnAsset, setSelectedReturnAsset] = useState<any>(null)

  // Attendance Tab State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyAttendance, setMonthlyAttendance] = useState<any>(null)
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${id}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      toast.error("Failed to load employee details")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchMonthlyAttendance = useCallback(async (month: number, year: number) => {
    setLoadingAttendance(true)
    try {
      const res = await fetch(`/api/employees/${id}/attendance?month=${month}&year=${year}`)
      if (res.ok) {
        setMonthlyAttendance(await res.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingAttendance(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchMonthlyAttendance(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, fetchMonthlyAttendance])

  const handleToggleStatus = async () => {
    try {
      const res = await fetch(`/api/employees/${id}/toggle-status`, { method: "PUT" })
      if (res.ok) {
        toast.success("Employee status updated")
        fetchData()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setShowToggleConfirm(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
        <div className="h-6 w-32 skeleton rounded-md" />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl skeleton" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 skeleton rounded-md" />
              <div className="h-4 w-32 skeleton rounded-md" />
            </div>
          </div>
        </div>
        <div className="h-10 w-full skeleton rounded-xl" />
        <div className="h-64 w-full skeleton rounded-2xl" />
      </div>
    )
  }

  if (!data || !data.employee) {
    return (
      <div className="max-w-7xl mx-auto p-16 text-center text-slate-500 font-medium">
        Employee record not found
      </div>
    )
  }

  const { employee, attendanceSummary, leaveBalance, activeTasks } = data
  const address = employee.address || {}
  const emergency = employee.emergencyContact || {}
  const assets: any[] = employee.assetsAssigned || []
  const activeAssets = assets.filter((a) => !a.isReturned)
  const returnedAssets = assets.filter((a) => a.isReturned)

  // Calendar logic
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  // Calculations
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null
    const dob = new Date(dobString)
    const ageDiff = Date.now() - dob.getTime()
    const ageDate = new Date(ageDiff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  const calculateTenure = (dojString?: string) => {
    if (!dojString) return null
    const doj = new Date(dojString)
    const now = new Date()
    const months = (now.getFullYear() - doj.getFullYear()) * 12 + (now.getMonth() - doj.getMonth())
    const yrs = Math.floor(months / 12)
    const remMonths = months % 12
    if (yrs === 0) return `${remMonths} mos`
    return `${yrs} yrs ${remMonths} mos`
  }

  const age = calculateAge(employee.dateOfBirth)
  const tenure = calculateTenure(employee.dateOfJoining)

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
  const permanentAddressText = address.sameAsCurrent
    ? currentAddressText
    : formatAddressString(address, true)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <div className="flex justify-between items-center">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Directory
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="bg-white border-slate-200 text-slate-700"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowToggleConfirm(true)}
            className={employee.isActive ? "text-rose-600 border-rose-200" : "text-emerald-600 border-emerald-200"}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            {employee.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN - Profile Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden lg:col-span-1 h-fit">
          <div className="h-20 bg-gradient-to-r from-indigo-600 to-slate-900 relative" />
          <div className="px-5 pb-5 pt-0 text-center relative -mt-10">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md mx-auto flex items-center justify-center relative z-10 mb-3">
              <span className="text-2xl font-bold text-indigo-700">
                {getInitials(employee.name)}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">{employee.name}</h2>
            <p className="text-slate-500 text-xs">{employee.jobTitle}</p>
            
            <div className="flex justify-center items-center gap-2 mt-2.5 mb-4">
              <span className="text-[11px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {employee.employeeId}
              </span>
              {employee.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  Inactive
                </span>
              )}
            </div>

            <div className="w-full h-px bg-slate-100 mb-4" />

            <div className="space-y-3 text-left text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700 truncate">{employee.email}</span>
              </div>
              
              {employee.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700">{employee.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{employee.department}</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">Joined {formatDate(employee.dateOfJoining)}</span>
              </div>

              {tenure && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">Company Tenure</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{tenure}</span>
                </div>
              )}

              {age && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Age</span>
                  <span className="font-semibold text-slate-700">{age} years</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Assigned Assets</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{activeAssets.length} active</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Comprehensive Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-white p-1 rounded-xl border border-slate-200/80 mb-4 h-auto flex-wrap">
              <TabsTrigger value="overview" className="text-xs py-2 px-3">Overview</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs py-2 px-3">Personal Info</TabsTrigger>
              <TabsTrigger value="address" className="text-xs py-2 px-3">Address</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs py-2 px-3">Emergency Contact</TabsTrigger>
              <TabsTrigger value="assets" className="text-xs py-2 px-3 relative">
                Assets
                {activeAssets.length > 0 && (
                  <span className="ml-1.5 bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {activeAssets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs py-2 px-3">Attendance</TabsTrigger>
              <TabsTrigger value="leaves" className="text-xs py-2 px-3">Leaves</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs py-2 px-3">Tasks</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Present Days</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceSummary?.present || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Leaves Left</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{leaveBalance?.casualLeave || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Tasks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeTasks?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Assets Held</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{activeAssets.length}</p>
                </div>
              </div>

              {/* Previews grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emergency Contact Quick View */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-indigo-600" />
                      Emergency Contact Preview
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowEmergencyModal(true)} className="h-7 text-xs">
                      Edit
                    </Button>
                  </div>
                  {emergency.name ? (
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p className="font-bold text-slate-900 text-sm">{emergency.name} <span className="text-xs font-normal text-slate-500">({emergency.relationship})</span></p>
                      <p className="flex items-center gap-2 text-indigo-600 font-semibold">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${emergency.primaryPhone}`}>{emergency.primaryPhone}</a>
                      </p>
                      {emergency.notes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                          ⚠️ {emergency.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">No emergency contact recorded</p>
                      <Button variant="link" size="sm" onClick={() => setShowEmergencyModal(true)} className="text-xs text-indigo-600">
                        + Add Emergency Contact
                      </Button>
                    </div>
                  )}
                </div>

                {/* Address Quick View */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Current Address Preview
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddressModal(true)} className="h-7 text-xs">
                      Edit
                    </Button>
                  </div>
                  {address.currentCity ? (
                    <div className="space-y-2 text-xs text-slate-700">
                      <p className="leading-relaxed">{currentAddressText}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentAddressText, "Address")}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentAddressText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">No address recorded</p>
                      <Button variant="link" size="sm" onClick={() => setShowAddressModal(true)} className="text-xs text-indigo-600">
                        + Add Address
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: PERSONAL INFO */}
            <TabsContent value="personal" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                <Button size="sm" onClick={() => setShowPersonalModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Personal Info
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-semibold text-slate-900">
                        {employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "Not Specified"} {age ? `(${age} yrs)` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Gender</span>
                      <span className="font-semibold text-slate-900">{employee.gender || "Not Specified"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Marital Status</span>
                      <span className="font-semibold text-slate-900">{employee.maritalStatus || "Not Specified"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Blood Group</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {formatBloodGroup(employee.bloodGroup)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Nationality</span>
                      <span className="font-semibold text-slate-900">{employee.nationality || "Indian"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Contact & Skills</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-500">Personal Email</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{employee.personalEmail || "Not Specified"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Alternate Phone</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{employee.alternatePhone || "Not Specified"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1.5">Languages Known</p>
                      {employee.languagesKnown ? (
                        <div className="flex flex-wrap gap-1.5">
                          {employee.languagesKnown.split(",").map((lang: string, i: number) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">None specified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: CONTACT & ADDRESS */}
            <TabsContent value="address" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Employee Addresses</h3>
                <Button size="sm" onClick={() => setShowAddressModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Addresses
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Address Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Current Address
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {currentAddressText}
                  </p>
                  {address.currentCity && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentAddressText, "Current Address")}
                        className="text-xs h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Address
                      </Button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentAddressText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs h-8 px-3 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Google Maps
                      </a>
                    </div>
                  )}
                </div>

                {/* Permanent Address Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-600" />
                      Permanent Address
                    </h4>
                    {address.sameAsCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        Same as Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {permanentAddressText}
                  </p>
                  {!address.sameAsCurrent && address.permanentCity && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(permanentAddressText, "Permanent Address")}
                        className="text-xs h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Address
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: EMERGENCY CONTACT */}
            <TabsContent value="emergency" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Emergency Contact Information</h3>
                <Button size="sm" onClick={() => setShowEmergencyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Contact
                </Button>
              </div>

              {emergency.name ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{emergency.name}</h4>
                      <span className="inline-block mt-1 bg-indigo-100 text-indigo-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                        {emergency.relationship}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <p className="text-slate-400 font-semibold uppercase">Primary Phone</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">{emergency.primaryPhone}</span>
                        <a
                          href={`tel:${emergency.primaryPhone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded font-bold"
                        >
                          Call
                        </a>
                      </div>
                    </div>

                    {emergency.secondaryPhone && (
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                        <p className="text-slate-400 font-semibold uppercase">Secondary Phone</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">{emergency.secondaryPhone}</span>
                          <a
                            href={`tel:${emergency.secondaryPhone}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded font-bold"
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    )}

                    {emergency.email && (
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                        <p className="text-slate-400 font-semibold uppercase">Email Address</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-900 truncate">{emergency.email}</span>
                          <a
                            href={`mailto:${emergency.email}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded font-bold"
                          >
                            Email
                          </a>
                        </div>
                      </div>
                    )}

                    {emergency.address && (
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                        <p className="text-slate-400 font-semibold uppercase">Contact Address</p>
                        <p className="font-medium text-slate-800">{emergency.address}</p>
                      </div>
                    )}
                  </div>

                  {emergency.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Medical Conditions / Special Instructions
                      </p>
                      <p className="text-xs text-amber-900 leading-relaxed pl-5">{emergency.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-xl border border-slate-200/70 text-center space-y-3">
                  <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">No Emergency Contact Registered</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adding an emergency contact ensures quick reachability during critical workplace emergencies.
                  </p>
                  <Button onClick={() => setShowEmergencyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    + Register Emergency Contact
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB 5: ASSETS */}
            <TabsContent value="assets" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assigned Equipment & Assets</h3>
                  <p className="text-xs text-slate-500">Hardware, gadgets, and access cards assigned to employee</p>
                </div>
                <Button onClick={() => setShowAssignAssetModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  + Assign Asset
                </Button>
              </div>

              {/* Active Assets Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Assets ({activeAssets.length})</h4>
                {activeAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeAssets.map((asset) => {
                      const isWarrantyExpiring = asset.warranty
                        ? new Date(asset.warranty).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000
                        : false

                      return (
                        <div key={asset.id} className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3 relative">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <AssetTypeIcon type={asset.assetType} className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-slate-900">{asset.assetName}</h5>
                                <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                              {asset.condition || "GOOD"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 block">Serial Number</span>
                              <span className="font-mono font-medium text-slate-800">{asset.serialNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Asset Tag</span>
                              <span className="font-mono font-medium text-slate-800">{asset.assetTag || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Assigned On</span>
                              <span className="font-medium text-slate-800">{formatDate(asset.assignedDate)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Warranty</span>
                              {asset.warranty ? (
                                <span className={`font-semibold ${isWarrantyExpiring ? "text-amber-600" : "text-slate-800"}`}>
                                  {formatDate(asset.warranty)}
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReturnAsset(asset)}
                              className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50 h-8"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Mark Returned
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-xl border border-slate-200/70 text-center space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No active assets assigned</p>
                  </div>
                )}
              </div>

              {/* Returned Assets Collapsible Table */}
              {returnedAssets.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Returned Assets History ({returnedAssets.length})</h4>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-3">Asset</th>
                          <th className="p-3">Serial / Tag</th>
                          <th className="p-3">Assigned Date</th>
                          <th className="p-3">Returned Date</th>
                          <th className="p-3">Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {returnedAssets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-900">{asset.assetName}</td>
                            <td className="p-3 font-mono text-slate-500">{asset.serialNumber || asset.assetTag || "N/A"}</td>
                            <td className="p-3">{formatDate(asset.assignedDate)}</td>
                            <td className="p-3">{asset.returnedDate ? formatDate(asset.returnedDate) : "N/A"}</td>
                            <td className="p-3 font-bold text-slate-600">{asset.returnCondition || "GOOD"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 6: ATTENDANCE */}
            <TabsContent value="attendance" className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">Attendance Log — {monthNames[selectedMonth - 1]} {selectedYear}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-bold text-slate-700 min-w-[100px] text-center">
                      {monthNames[selectedMonth - 1]} {selectedYear}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 py-2 border-b border-slate-100">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-14 bg-slate-50/50 rounded-lg" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1
                    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum)
                    const dateStr = dateObj.toISOString().split("T")[0]
                    const log = monthlyAttendance?.logs?.find((l: any) => l.date.split("T")[0] === dateStr)
                    const weekend = isWeekend(dateObj)

                    let statusClass = "bg-slate-50 text-slate-400"
                    if (log) {
                      if (log.status === "PRESENT") statusClass = "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      else if (log.status === "LATE") statusClass = "bg-amber-50 text-amber-700 border border-amber-200"
                      else if (log.status === "ABSENT") statusClass = "bg-rose-50 text-rose-700 border border-rose-200"
                      else if (log.status === "LEAVE") statusClass = "bg-purple-50 text-purple-700 border border-purple-200"
                    } else if (weekend) {
                      statusClass = "bg-slate-100 text-slate-400"
                    }

                    return (
                      <div
                        key={dayNum}
                        onClick={() => log && setSelectedDayLog(log)}
                        className={`h-14 p-2 rounded-lg flex flex-col justify-between text-xs cursor-pointer transition-all ${statusClass}`}
                      >
                        <span className="font-bold">{dayNum}</span>
                        {log && <span className="text-[10px] font-semibold">{log.status}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB 7: LEAVES */}
            <TabsContent value="leaves" className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Leave Balance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Casual Leave</p>
                    <p className="text-lg font-bold text-slate-900">{leaveBalance?.casualLeave - leaveBalance?.usedCasual} / {leaveBalance?.casualLeave}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Sick Leave</p>
                    <p className="text-lg font-bold text-slate-900">{leaveBalance?.sickLeave - leaveBalance?.usedSick} / {leaveBalance?.sickLeave}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Paid Leave</p>
                    <p className="text-lg font-bold text-slate-900">{leaveBalance?.paidLeave - leaveBalance?.usedPaid} / {leaveBalance?.paidLeave}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">WFH Allowance</p>
                    <p className="text-lg font-bold text-indigo-600">{leaveBalance?.wfhLeave - leaveBalance?.usedWFH} / {leaveBalance?.wfhLeave}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 8: TASKS */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Active Tasks ({activeTasks?.length || 0})</h3>
                {activeTasks && activeTasks.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {activeTasks.map((t: any) => (
                      <div key={t.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{t.title}</p>
                          <p className="text-slate-400 mt-0.5">{t.description || "No description"}</p>
                        </div>
                        <span className="font-bold uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No active tasks assigned</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Basic Employee Modal */}
      {showEditModal && (
        <EditEmployeeModal
          open={showEditModal}
          employee={employee}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Personal Info Modal */}
      {showPersonalModal && (
        <PersonalInfoModal
          open={showPersonalModal}
          userId={employee.id}
          initialData={employee}
          onClose={() => setShowPersonalModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          open={showAddressModal}
          userId={employee.id}
          initialData={address}
          onClose={() => setShowAddressModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <EmergencyContactModal
          open={showEmergencyModal}
          userId={employee.id}
          initialData={emergency}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Assign Asset Modal */}
      {showAssignAssetModal && (
        <AssignAssetModal
          open={showAssignAssetModal}
          userId={employee.id}
          onClose={() => setShowAssignAssetModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Return Asset Modal */}
      {selectedReturnAsset && (
        <ReturnAssetModal
          open={!!selectedReturnAsset}
          userId={employee.id}
          asset={selectedReturnAsset}
          onClose={() => setSelectedReturnAsset(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        open={showToggleConfirm}
        title={employee.isActive ? "Deactivate Employee" : "Activate Employee"}
        description={`Are you sure you want to ${employee.isActive ? "deactivate" : "activate"} ${employee.name}?`}
        onConfirm={handleToggleStatus}
        onClose={() => setShowToggleConfirm(false)}
      />
    </div>
  )
}
