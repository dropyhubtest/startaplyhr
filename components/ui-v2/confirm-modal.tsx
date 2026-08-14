"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, HelpCircle, Trash2, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "primary" | "destructive" | "success" | "warning"
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
        )
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <HelpCircle className="w-6 h-6" />
          </div>
        )
    }
  }

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
      default:
        return "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-6 text-center rounded-2xl border-slate-200 shadow-xl overflow-hidden">
        {getIcon()}

        <DialogHeader className="text-center space-y-1.5">
          <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="flex-1 text-xs h-9 font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 text-xs h-9 font-bold shadow-md transition-all active:scale-[0.98]",
              getConfirmButtonStyles()
            )}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
