"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCardSkeleton } from "./loading-skeleton"

type StatsCardColor = 
  "indigo" | "blue" | "emerald" | "amber" | 
  "rose" | "purple" | "slate"

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  color?: StatsCardColor
  description?: string
  trend?: {
    value: number
    positive: boolean
  }
  loading?: boolean
  onClick?: () => void
}

const colorMap: Record<StatsCardColor, {
  iconBg: string
  iconText: string
  glow: string
}> = {
  indigo: { 
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    iconText: "text-white",
    glow: "shadow-indigo-500/20"
  },
  blue: { 
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
    iconText: "text-white",
    glow: "shadow-blue-500/20"
  },
  emerald: { 
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconText: "text-white",
    glow: "shadow-emerald-500/20"
  },
  amber: { 
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconText: "text-white",
    glow: "shadow-amber-500/20"
  },
  rose: { 
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    iconText: "text-white",
    glow: "shadow-rose-500/20"
  },
  purple: { 
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    iconText: "text-white",
    glow: "shadow-purple-500/20"
  },
  slate: { 
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-800",
    iconText: "text-white",
    glow: "shadow-slate-500/20"
  },
}

export function StatsCard({
  title, value, icon: Icon, color = "indigo",
  description, trend, loading, onClick,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />
  
  const c = colorMap[color]

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white border border-slate-200/70 " +
        "rounded-xl p-5 transition-all duration-200 " +
        "hover:shadow-md hover:shadow-slate-200/50 " +
        "hover:border-slate-300 group overflow-hidden",
        onClick && "cursor-pointer"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br 
        from-transparent to-slate-50/50 opacity-0 
        group-hover:opacity-100 transition-opacity 
        pointer-events-none" />
      
      <div className="relative flex items-start 
        justify-between mb-4">
        <p className="text-[12.5px] font-medium 
          text-slate-500 leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shadow-lg",
            c.iconBg, c.glow
          )}>
            <Icon className={cn("w-4 h-4", c.iconText)} 
              strokeWidth={2.25} />
          </div>
        )}
      </div>
      
      <div className="relative flex items-baseline gap-2">
        <p className="text-[28px] font-bold text-slate-900 
          tabular-nums tracking-tight leading-none">
          {value}
        </p>
        {trend && (
          <span className={cn(
            "text-[11.5px] font-semibold px-1.5 py-0.5 rounded",
            trend.positive 
              ? "text-emerald-700 bg-emerald-50" 
              : "text-rose-700 bg-rose-50"
          )}>
            {trend.positive ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="relative text-[11.5px] text-slate-500 
          mt-2 leading-tight">
          {description}
        </p>
      )}
    </div>
  )
}
