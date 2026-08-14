"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BloodGroupSelect } from "@/components/shared/blood-group-select"
import { IndianStatesSelect } from "@/components/shared/indian-states-select"
import { DEPARTMENTS } from "@/lib/constants"
import { toast } from "sonner"
import {
  Loader2,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  User,
  UserCheck,
  MapPin,
  PhoneCall,
  ClipboardList,
  Check,
  ChevronRight,
  ChevronLeft,
  Bookmark,
} from "lucide-react"

interface CreateEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const STEPS = [
  { id: 1, name: "Basic Info", icon: User },
  { id: 2, name: "Personal Info", icon: UserCheck },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Emergency", icon: PhoneCall },
  { id: 5, name: "Review", icon: ClipboardList },
]

export function CreateEmployeeModal({ open, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<{ employeeId: string; email: string } | null>(null)
  const [confirmedAccurate, setConfirmedAccurate] = useState(false)

  // Form states across all 5 steps
  const [formData, setFormData] = useState({
    // Step 1: Basic
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "Engineering",
    jobTitle: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    salary: "",
    // Step 2: Personal
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationality: "Indian",
    bloodGroup: "",
    personalEmail: "",
    alternatePhone: "",
    languagesKnown: "",
    // Step 3: Address
    address: {
      currentStreet: "",
      currentCity: "",
      currentState: "",
      currentCountry: "India",
      currentZipCode: "",
      currentLandmark: "",
      permanentStreet: "",
      permanentCity: "",
      permanentState: "",
      permanentCountry: "India",
      permanentZipCode: "",
      permanentLandmark: "",
      sameAsCurrent: false,
    },
    // Step 4: Emergency
    emergencyContact: {
      name: "",
      relationship: "",
      primaryPhone: "",
      secondaryPhone: "",
      email: "",
      address: "",
      notes: "",
    },
  })

  // Load draft from localStorage if available
  useEffect(() => {
    if (open) {
      const savedDraft = localStorage.getItem("create_employee_draft")
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          setFormData(parsed)
        } catch (e) {}
      }
    }
  }, [open])

  const handleSaveDraft = () => {
    localStorage.setItem("create_employee_draft", JSON.stringify(formData))
    toast.success("Form draft saved to browser storage!")
  }

  const handleClearDraft = () => {
    localStorage.removeItem("create_employee_draft")
  }

  // Step validations
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        toast.error("Please enter a valid full name")
        return false
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Please enter a valid email address")
        return false
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters")
        return false
      }
      if (!formData.jobTitle.trim()) {
        toast.error("Please enter job title")
        return false
      }
      if (!formData.dateOfJoining) {
        toast.error("Please select date of joining")
        return false
      }
    } else if (step === 2) {
      if (formData.dateOfBirth) {
        const dob = new Date(formData.dateOfBirth)
        const age = (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        if (age < 18) {
          toast.error("Employee must be at least 18 years old")
          return false
        }
      }
      if (formData.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
        toast.error("Please enter a valid personal email format")
        return false
      }
    } else if (step === 3) {
      if (formData.address.currentZipCode && !/^\d{6}$/.test(formData.address.currentZipCode.trim())) {
        toast.error("Current Zip Code must be 6 digits")
        return false
      }
    } else if (step === 4) {
      if (formData.emergencyContact.name.trim() && !formData.emergencyContact.primaryPhone.trim()) {
        toast.error("Primary phone is required when adding emergency contact")
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!confirmedAccurate) {
      toast.error("Please confirm that all entered information is accurate")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to create employee")
      }

      handleClearDraft()
      setCredentials(result.credentials)
      setShowCredentials(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = () => {
    setShowCredentials(false)
    setCredentials(null)
    setCurrentStep(1)
    onSuccess()
    onClose()
  }

  const handleCopyCredentials = () => {
    if (credentials) {
      const text = `Employee ID: ${credentials.employeeId}\nEmail: ${credentials.email}`
      navigator.clipboard.writeText(text)
      toast.success("Credentials copied to clipboard!")
    }
  }

  const progressPercent = (currentStep / 5) * 100

  return (
    <>
      <Dialog open={open && !showCredentials} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
          {/* Top Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-1 overflow-hidden min-h-[540px]">
            {/* Left Step Sidebar */}
            <div className="w-60 bg-slate-900 text-white p-6 flex flex-col justify-between flex-shrink-0">
              <div>
                <div className="mb-8">
                  <h3 className="text-base font-bold text-white tracking-tight">Onboard Employee</h3>
                  <p className="text-[11px] text-slate-400 mt-1">5-Step Onboarding Wizard</p>
                </div>

                <div className="space-y-4">
                  {STEPS.map((step) => {
                    const Icon = step.icon
                    const isDone = step.id < currentStep
                    const isCurrent = step.id === currentStep

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          if (step.id < currentStep) setCurrentStep(step.id)
                        }}
                        disabled={step.id > currentStep}
                        className={`flex items-center gap-3 w-full text-left p-2.5 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/30"
                            : isDone
                            ? "bg-slate-800/80 text-emerald-400 cursor-pointer hover:bg-slate-800"
                            : "text-slate-500 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCurrent
                              ? "bg-white text-indigo-600"
                              : isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : step.id}
                        </div>
                        <span className="text-xs">{step.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <span className="text-[10px] text-slate-500">Step {currentStep} of 5</span>
              </div>
            </div>

            {/* Right Main Form Content */}
            <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto bg-slate-50/50">
              <div>
                <DialogHeader className="mb-5">
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    {STEPS[currentStep - 1].name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Fill in the required information for step {currentStep} of 5.
                  </DialogDescription>
                </DialogHeader>

                {/* STEP 1: BASIC INFO */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Work Email *</Label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@startaply.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Initial Password *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Mobile Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit number"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Department</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(val: any) => setFormData({ ...formData, department: val || "Engineering" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Job Title *</Label>
                      <Input
                        required
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Date of Joining *</Label>
                      <Input
                        type="date"
                        required
                        value={formData.dateOfJoining}
                        onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Annual Salary (₹)</Label>
                      <Input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. 600000"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: PERSONAL INFO */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(val: any) => setFormData({ ...formData, gender: val || "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Marital Status</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(val: any) => setFormData({ ...formData, maritalStatus: val || "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Marital Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Blood Group</Label>
                      <BloodGroupSelect
                        value={formData.bloodGroup}
                        onChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Nationality</Label>
                      <Input
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="Indian"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Personal Email</Label>
                      <Input
                        type="email"
                        value={formData.personalEmail}
                        onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                        placeholder="personal@email.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Alternate Phone</Label>
                      <Input
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        placeholder="10-digit alternate contact"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Languages Known</Label>
                      <Input
                        value={formData.languagesKnown}
                        onChange={(e) => setFormData({ ...formData, languagesKnown: e.target.value })}
                        placeholder="English, Hindi, Marathi"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: ADDRESS DETAILS */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Current Address</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Input
                            value={formData.address.currentStreet}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  currentStreet: val,
                                  ...(prev.address.sameAsCurrent ? { permanentStreet: val } : {}),
                                },
                              }))
                            }}
                            placeholder="Street / House No"
                          />
                        </div>
                        <Input
                          value={formData.address.currentCity}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                currentCity: val,
                                ...(prev.address.sameAsCurrent ? { permanentCity: val } : {}),
                              },
                            }))
                          }}
                          placeholder="City"
                        />
                        <IndianStatesSelect
                          value={formData.address.currentState}
                          onChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                currentState: val,
                                ...(prev.address.sameAsCurrent ? { permanentState: val } : {}),
                              },
                            }))
                          }}
                        />
                        <Input
                          value={formData.address.currentZipCode}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                currentZipCode: val,
                                ...(prev.address.sameAsCurrent ? { permanentZipCode: val } : {}),
                              },
                            }))
                          }}
                          placeholder="6-digit Zip Code"
                        />
                        <Input
                          value={formData.address.currentLandmark}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                currentLandmark: val,
                                ...(prev.address.sameAsCurrent ? { permanentLandmark: val } : {}),
                              },
                            }))
                          }}
                          placeholder="Landmark (Optional)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                      <input
                        type="checkbox"
                        id="wizardSameAsCurrent"
                        checked={formData.address.sameAsCurrent}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setFormData((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              sameAsCurrent: checked,
                              ...(checked
                                ? {
                                    permanentStreet: prev.address.currentStreet,
                                    permanentCity: prev.address.currentCity,
                                    permanentState: prev.address.currentState,
                                    permanentZipCode: prev.address.currentZipCode,
                                    permanentLandmark: prev.address.currentLandmark,
                                  }
                                : {}),
                            },
                          }))
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="wizardSameAsCurrent" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Permanent address is same as current address
                      </label>
                    </div>

                    {!formData.address.sameAsCurrent && (
                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Permanent Address</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Input
                              value={formData.address.permanentStreet}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address: { ...formData.address, permanentStreet: e.target.value },
                                })
                              }
                              placeholder="Street / House No"
                            />
                          </div>
                          <Input
                            value={formData.address.permanentCity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, permanentCity: e.target.value },
                              })
                            }
                            placeholder="City"
                          />
                          <IndianStatesSelect
                            value={formData.address.permanentState}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, permanentState: val },
                              })
                            }
                          />
                          <Input
                            value={formData.address.permanentZipCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, permanentZipCode: e.target.value },
                              })
                            }
                            placeholder="6-digit Zip Code"
                          />
                          <Input
                            value={formData.address.permanentLandmark}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, permanentLandmark: e.target.value },
                              })
                            }
                            placeholder="Landmark (Optional)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: EMERGENCY CONTACT */}
                {currentStep === 4 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Contact Name</Label>
                      <Input
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                          })
                        }
                        placeholder="Full Name"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Relationship</Label>
                      <Select
                        value={formData.emergencyContact.relationship}
                        onValueChange={(val: any) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, relationship: val || "" },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FATHER">Father</SelectItem>
                          <SelectItem value="MOTHER">Mother</SelectItem>
                          <SelectItem value="SPOUSE">Spouse</SelectItem>
                          <SelectItem value="SIBLING">Sibling</SelectItem>
                          <SelectItem value="FRIEND">Friend</SelectItem>
                          <SelectItem value="GUARDIAN">Guardian</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Primary Phone</Label>
                      <Input
                        value={formData.emergencyContact.primaryPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, primaryPhone: e.target.value },
                          })
                        }
                        placeholder="10-digit number"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Secondary Phone</Label>
                      <Input
                        value={formData.emergencyContact.secondaryPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, secondaryPhone: e.target.value },
                          })
                        }
                        placeholder="Optional phone"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                      <Input
                        type="email"
                        value={formData.emergencyContact.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, email: e.target.value },
                          })
                        }
                        placeholder="contact@email.com"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Medical Notes / Allergies</Label>
                      <Textarea
                        rows={2}
                        value={formData.emergencyContact.notes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, notes: e.target.value },
                          })
                        }
                        placeholder="Allergies, chronic conditions, special instructions"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: REVIEW & SUBMIT */}
                {currentStep === 5 && (
                  <div className="space-y-4 text-xs">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 uppercase">1. Basic Info</h4>
                        <button type="button" onClick={() => setCurrentStep(1)} className="text-indigo-600 hover:underline">
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <p><span className="font-semibold">Name:</span> {formData.name}</p>
                        <p><span className="font-semibold">Email:</span> {formData.email}</p>
                        <p><span className="font-semibold">Job Title:</span> {formData.jobTitle}</p>
                        <p><span className="font-semibold">Department:</span> {formData.department}</p>
                        <p><span className="font-semibold">Joining:</span> {formData.dateOfJoining}</p>
                        <p><span className="font-semibold">Salary:</span> ₹{formData.salary || "N/A"}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 uppercase">2. Personal Info</h4>
                        <button type="button" onClick={() => setCurrentStep(2)} className="text-indigo-600 hover:underline">
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <p><span className="font-semibold">DOB:</span> {formData.dateOfBirth || "N/A"}</p>
                        <p><span className="font-semibold">Gender:</span> {formData.gender || "N/A"}</p>
                        <p><span className="font-semibold">Blood Group:</span> {formData.bloodGroup || "N/A"}</p>
                        <p><span className="font-semibold">Personal Email:</span> {formData.personalEmail || "N/A"}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 uppercase">3. Address & Emergency</h4>
                        <button type="button" onClick={() => setCurrentStep(3)} className="text-indigo-600 hover:underline">
                          Edit
                        </button>
                      </div>
                      <p className="text-slate-600">
                        <span className="font-semibold">Current City:</span> {formData.address.currentCity || "N/A"}, {formData.address.currentState || "N/A"}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold">Emergency Contact:</span> {formData.emergencyContact.name || "N/A"} ({formData.emergencyContact.primaryPhone || "N/A"})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="confirmAccurate"
                        checked={confirmedAccurate}
                        onChange={(e) => setConfirmedAccurate(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <label htmlFor="confirmAccurate" className="font-bold text-slate-800 cursor-pointer">
                        All information is accurate and verified
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-slate-200/70 flex justify-between items-center mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                {currentStep < 5 ? (
                  <Button type="button" onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !confirmedAccurate}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Employee
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal */}
      <Dialog open={showCredentials} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
          <div className="p-6">
            <DialogHeader>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-center text-xl font-bold text-slate-800">
                Employee Profile Created!
              </DialogTitle>
              <DialogDescription className="text-center text-slate-500 mt-2">
                All 4 sections (Basic, Personal, Address, Emergency) have been registered.
              </DialogDescription>
            </DialogHeader>

            {credentials && (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Employee ID</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {credentials.employeeId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Work Email</span>
                  <span className="font-semibold text-slate-900">{credentials.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700"
                  onClick={handleCopyCredentials}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Login Details
                </Button>
              </div>
            )}

            <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white" onClick={handleDone}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
