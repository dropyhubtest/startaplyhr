"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BloodGroupSelect } from "@/components/shared/blood-group-select"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

interface PersonalInfoModalProps {
  open: boolean
  userId: string
  initialData?: any
  onClose: () => void
  onSuccess: () => void
}

export function PersonalInfoModal({
  open,
  userId,
  initialData,
  onClose,
  onSuccess,
}: PersonalInfoModalProps) {
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationality: "Indian",
    bloodGroup: "",
    personalEmail: "",
    alternatePhone: "",
    languagesKnown: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: initialData.gender || "",
        maritalStatus: initialData.maritalStatus || "",
        nationality: initialData.nationality || "Indian",
        bloodGroup: initialData.bloodGroup || "",
        personalEmail: initialData.personalEmail || "",
        alternatePhone: initialData.alternatePhone || "",
        languagesKnown: initialData.languagesKnown || "",
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/employees/${userId}/personal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Personal information updated successfully!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "Failed to update personal info")
      }
    } catch (err) {
      toast.error("Network error. Failed to update personal info.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <User className="w-5 h-5 text-indigo-600" />
            Edit Personal Information
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
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

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Marital Status</label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(val: any) => setFormData({ ...formData, maritalStatus: val || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Blood Group</label>
              <BloodGroupSelect
                value={formData.bloodGroup}
                onChange={(val) => setFormData({ ...formData, bloodGroup: val })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. Indian"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Personal Email</label>
              <Input
                type="email"
                value={formData.personalEmail}
                onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                placeholder="personal@gmail.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Alternate Phone</label>
              <Input
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                placeholder="10-digit number"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Languages Known</label>
              <Input
                value={formData.languagesKnown}
                onChange={(e) => setFormData({ ...formData, languagesKnown: e.target.value })}
                placeholder="e.g. English, Hindi, Marathi"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
