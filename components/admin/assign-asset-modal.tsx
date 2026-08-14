"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ASSET_TYPES } from "@/components/shared/asset-type-icon"
import { toast } from "sonner"
import { Loader2, PackagePlus } from "lucide-react"

interface AssignAssetModalProps {
  open: boolean
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function AssignAssetModal({
  open,
  userId,
  onClose,
  onSuccess,
}: AssignAssetModalProps) {
  const [formData, setFormData] = useState({
    assetType: "LAPTOP",
    assetName: "",
    brand: "",
    model: "",
    serialNumber: "",
    assetTag: "",
    condition: "GOOD",
    purchaseDate: "",
    purchaseCost: "",
    warranty: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  const handleAssetTypeChange = (type: string) => {
    let defaultName = ""
    if (type === "LAPTOP") defaultName = "MacBook Pro 14"
    else if (type === "MOBILE") defaultName = "iPhone 15 Pro"
    else if (type === "MONITOR") defaultName = "Dell UltraSharp 27"
    else if (type === "HEADPHONES") defaultName = "Sony WH-1000XM5"
    else if (type === "KEYBOARD") defaultName = "Logitech MX Keys"
    else if (type === "MOUSE") defaultName = "Logitech MX Master 3S"

    setFormData((prev) => ({
      ...prev,
      assetType: type,
      assetName: prev.assetName || defaultName,
    }))
  }

  const handleAutoGenerateAssetTag = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setFormData((prev) => ({
      ...prev,
      assetTag: `AST-${prev.assetType.substring(0, 3)}-${randomSuffix}`,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/employees/${userId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Asset assigned successfully!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "Failed to assign asset")
      }
    } catch (err) {
      toast.error("Failed to assign asset")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <PackagePlus className="w-5 h-5 text-indigo-600" />
            Assign New Asset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Asset Category *</label>
              <Select value={formData.assetType} onValueChange={(val: any) => handleAssetTypeChange(val || "LAPTOP")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Asset Type" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Asset Name *</label>
              <Input
                required
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                placeholder="e.g. MacBook Pro 14 M3"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Brand</label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Apple, Dell, Sony"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Model</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. M3 Pro / XPS 15"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Serial Number</label>
              <Input
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Device Serial Number"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 block">Asset Tag / Code</label>
                <button
                  type="button"
                  onClick={handleAutoGenerateAssetTag}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Auto-generate
                </button>
              </div>
              <Input
                value={formData.assetTag}
                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                placeholder="e.g. AST-LAP-1029"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Condition on Assignment</label>
              <Select
                value={formData.condition}
                onValueChange={(val: any) => setFormData({ ...formData, condition: val || "GOOD" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New (Unopened/Brand New)</SelectItem>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Date</label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Cost (₹)</label>
              <Input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                placeholder="Cost in INR"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Warranty Expiry Date</label>
              <Input
                type="date"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Accessories Included</label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Charger, Dongle, Case included..."
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
              Assign Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
