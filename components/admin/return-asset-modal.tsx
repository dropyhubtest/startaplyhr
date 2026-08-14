"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, RotateCcw } from "lucide-react"

interface ReturnAssetModalProps {
  open: boolean
  userId: string
  asset: any
  onClose: () => void
  onSuccess: () => void
}

export function ReturnAssetModal({
  open,
  userId,
  asset,
  onClose,
  onSuccess,
}: ReturnAssetModalProps) {
  const [returnCondition, setReturnCondition] = useState("GOOD")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!asset) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/employees/${userId}/assets/${asset.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnCondition, notes }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Marked ${asset.assetName} as returned!`)
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "Failed to return asset")
      }
    } catch (err) {
      toast.error("Failed to process return")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            Mark Asset as Returned
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-slate-500">Selected Asset</p>
            <p className="text-sm font-bold text-slate-900">{asset.assetName}</p>
            {asset.serialNumber && (
              <p className="text-xs text-slate-500 font-mono">S/N: {asset.serialNumber}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Return Condition *</label>
            <Select value={returnCondition} onValueChange={(val: any) => setReturnCondition(val || "GOOD")}>
              <SelectTrigger>
                <SelectValue placeholder="Select Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">Excellent (Like New)</SelectItem>
                <SelectItem value="GOOD">Good (Normal Wear)</SelectItem>
                <SelectItem value="FAIR">Fair (Minor Scratches)</SelectItem>
                <SelectItem value="DAMAGED">Damaged (Needs Repair)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Return Notes / Comments</label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over charger and cable. Screen is scratch free."
            />
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
