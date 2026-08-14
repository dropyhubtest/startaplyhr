"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IndianStatesSelect } from "@/components/shared/indian-states-select"
import { toast } from "sonner"
import { Loader2, MapPin } from "lucide-react"

interface AddressModalProps {
  open: boolean
  userId: string
  initialData?: any
  onClose: () => void
  onSuccess: () => void
}

export function AddressModal({
  open,
  userId,
  initialData,
  onClose,
  onSuccess,
}: AddressModalProps) {
  const [formData, setFormData] = useState({
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
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        currentStreet: initialData.currentStreet || "",
        currentCity: initialData.currentCity || "",
        currentState: initialData.currentState || "",
        currentCountry: initialData.currentCountry || "India",
        currentZipCode: initialData.currentZipCode || "",
        currentLandmark: initialData.currentLandmark || "",
        permanentStreet: initialData.permanentStreet || "",
        permanentCity: initialData.permanentCity || "",
        permanentState: initialData.permanentState || "",
        permanentCountry: initialData.permanentCountry || "India",
        permanentZipCode: initialData.permanentZipCode || "",
        permanentLandmark: initialData.permanentLandmark || "",
        sameAsCurrent: initialData.sameAsCurrent || false,
      })
    }
  }, [initialData, open])

  const handleSameAsCurrentToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsCurrent: checked,
      ...(checked
        ? {
            permanentStreet: prev.currentStreet,
            permanentCity: prev.currentCity,
            permanentState: prev.currentState,
            permanentCountry: prev.currentCountry,
            permanentZipCode: prev.currentZipCode,
            permanentLandmark: prev.currentLandmark,
          }
        : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/employees/${userId}/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Address details updated successfully!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "Failed to update address")
      }
    } catch (err) {
      toast.error("Failed to update address")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Edit Address Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Current Address */}
          <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Current Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Street / House No / Area</label>
                <Input
                  value={formData.currentStreet}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      currentStreet: val,
                      ...(prev.sameAsCurrent ? { permanentStreet: val } : {}),
                    }))
                  }}
                  placeholder="Street, Flat No, Building"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                <Input
                  value={formData.currentCity}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      currentCity: val,
                      ...(prev.sameAsCurrent ? { permanentCity: val } : {}),
                    }))
                  }}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                <IndianStatesSelect
                  value={formData.currentState}
                  onChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      currentState: val,
                      ...(prev.sameAsCurrent ? { permanentState: val } : {}),
                    }))
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Zip Code</label>
                <Input
                  value={formData.currentZipCode}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      currentZipCode: val,
                      ...(prev.sameAsCurrent ? { permanentZipCode: val } : {}),
                    }))
                  }}
                  placeholder="6-digit PIN"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Landmark (Optional)</label>
                <Input
                  value={formData.currentLandmark}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      currentLandmark: val,
                      ...(prev.sameAsCurrent ? { permanentLandmark: val } : {}),
                    }))
                  }}
                  placeholder="Near Park / Station"
                />
              </div>
            </div>
          </div>

          {/* Same as Current Checkbox */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="sameAsCurrent"
              checked={formData.sameAsCurrent}
              onChange={(e) => handleSameAsCurrentToggle(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="sameAsCurrent" className="text-xs font-bold text-slate-700 cursor-pointer">
              Permanent address is same as current address
            </label>
          </div>

          {/* Permanent Address */}
          {!formData.sameAsCurrent && (
            <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Permanent Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Street / House No / Area</label>
                  <Input
                    value={formData.permanentStreet}
                    onChange={(e) => setFormData({ ...formData, permanentStreet: e.target.value })}
                    placeholder="Street, Flat No, Building"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <Input
                    value={formData.permanentCity}
                    onChange={(e) => setFormData({ ...formData, permanentCity: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                  <IndianStatesSelect
                    value={formData.permanentState}
                    onChange={(val) => setFormData({ ...formData, permanentState: val })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Zip Code</label>
                  <Input
                    value={formData.permanentZipCode}
                    onChange={(e) => setFormData({ ...formData, permanentZipCode: e.target.value })}
                    placeholder="6-digit PIN"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Landmark (Optional)</label>
                  <Input
                    value={formData.permanentLandmark}
                    onChange={(e) => setFormData({ ...formData, permanentLandmark: e.target.value })}
                    placeholder="Near Park / Station"
                  />
                </div>
              </div>
            </div>
          )}

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
              Save Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
