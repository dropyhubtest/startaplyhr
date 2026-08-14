"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function HoverCard({ children, className, onClick }: HoverCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover-lift transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  )
}
