"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { MapPin, Shield, Loader2 } from "lucide-react"

interface LocationConsentModalProps {
  open: boolean
  onClose: () => void
  onConsent: () => void
  onDeny: () => void
  loading?: boolean
}

export function LocationConsentModal({
  open,
  onClose,
  onConsent,
  onDeny,
  loading = false,
}: LocationConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-slate-200 p-0 overflow-hidden rounded-xl">
        <div className="px-6 pt-6 pb-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-indigo-600" />
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-[18px] font-bold text-slate-900">
              Enable Location Tracking
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-3 text-[13px] leading-relaxed">
              Startaply HR would like to record your location when you clock in
              and clock out. This helps with attendance verification and is
              visible to your HR administrator.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-emerald-800">Your Privacy Matters</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Location is only captured during clock-in/out actions. We don't
                  track your location continuously unless enabled by your
                  company.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <MapPin className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-slate-700">What We Record</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  GPS coordinates, approximate address, and the time of each
                  clock-in/out event.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-semibold shadow-sm transition-all"
            onClick={onDeny}
          >
            Skip Location
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            onClick={onConsent}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Allow Location
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
