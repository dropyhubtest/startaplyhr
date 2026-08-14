"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, PhoneCall } from "lucide-react"

interface EmergencyContactModalProps {
  open: boolean
  userId: string
  initialData?: any
  onClose: () => void
  onSuccess: () => void
}

export function EmergencyContactModal({
  open,
  userId,
  initialData,
  onClose,
  onSuccess,
}: EmergencyContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    primaryPhone: "",
    secondaryPhone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        relationship: initialData.relationship || "",
        primaryPhone: initialData.primaryPhone || "",
        secondaryPhone: initialData.secondaryPhone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        notes: initialData.notes || "",
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/employees/${userId}/emergency-contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Emergency contact details updated successfully!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "Failed to update emergency contact")
      }
    } catch (err) {
      toast.error("Failed to update emergency contact")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <PhoneCall className="w-5 h-5 text-indigo-600" />
            Edit Emergency Contact
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Relationship *</label>
              <Select
                value={formData.relationship}
                onValueChange={(val: any) => setFormData({ ...formData, relationship: val || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Relation" />
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

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Phone *</label>
              <Input
                required
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                placeholder="10-digit Phone"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Secondary Phone</label>
              <Input
                value={formData.secondaryPhone}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                placeholder="Optional Phone"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full Address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Medical Notes / Allergies (Optional)
              </label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any known medical conditions, allergies, or instructions"
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
              Save Emergency Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
