"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PulseBadgeProps {
  count: number
  maxCount?: number
  className?: string
}

export function PulseBadge({ count, maxCount = 99, className }: PulseBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > maxCount ? `${maxCount}+` : count

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-sm animate-pulse-soft transition-all duration-300",
        className
      )}
    >
      {displayCount}
    </span>
  )
}
