"use client"

import { cn } from "@/lib/utils"

interface StatusPillProps {
  status: "WORKING" | "ON_BREAK" | "LOGGED_OUT" | "ABSENT" | "ON_LEAVE" | string
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const getDetails = () => {
    switch (status) {
      case "WORKING":
        return {
          label: "Working",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: true,
        }
      case "ON_BREAK":
        return {
          label: "On Break",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: false,
        }
      case "LOGGED_OUT":
        return {
          label: "Offline",
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: false,
        }
      case "ON_LEAVE":
        return {
          label: "On Leave",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          dot: false,
        }
      case "ABSENT":
        return {
          label: "Absent",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: false,
        }
      default:
        return {
          label: status,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: false,
        }
    }
  }

  const details = getDetails()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs transition-all",
        details.bg,
        className
      )}
    >
      {details.dot && <span className="live-dot" />}
      {details.label}
    </span>
  )
}
