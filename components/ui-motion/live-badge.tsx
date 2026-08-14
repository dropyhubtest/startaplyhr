"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface LiveBadgeProps {
  children?: React.ReactNode
  className?: string
}

export function LiveBadge({ children = "LIVE", className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs",
        className
      )}
    >
      <span className="live-dot flex-shrink-0" />
      <span>{children}</span>
    </span>
  )
}
