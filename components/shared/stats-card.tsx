"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCardSkeleton } from "./loading-skeleton"

type StatsCardColor =
  | "indigo"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "slate"

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

const colorMap: Record<
  StatsCardColor,
  {
    topBar: string
    iconBg: string
    iconText: string
    glow: string
    ring: string
    ambientBg: string
  }
> = {
  indigo: {
    topBar: "from-indigo-500 via-blue-500 to-indigo-600",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    iconText: "text-white",
    glow: "shadow-indigo-500/25",
    ring: "group-hover:ring-indigo-100",
    ambientBg: "from-indigo-500/10 to-blue-500/5",
  },
  blue: {
    topBar: "from-blue-500 via-cyan-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
    iconText: "text-white",
    glow: "shadow-blue-500/25",
    ring: "group-hover:ring-blue-100",
    ambientBg: "from-blue-500/10 to-cyan-500/5",
  },
  emerald: {
    topBar: "from-emerald-500 via-teal-500 to-emerald-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconText: "text-white",
    glow: "shadow-emerald-500/25",
    ring: "group-hover:ring-emerald-100",
    ambientBg: "from-emerald-500/10 to-teal-500/5",
  },
  amber: {
    topBar: "from-amber-500 via-orange-500 to-amber-600",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconText: "text-white",
    glow: "shadow-amber-500/25",
    ring: "group-hover:ring-amber-100",
    ambientBg: "from-amber-500/10 to-orange-500/5",
  },
  rose: {
    topBar: "from-rose-500 via-pink-500 to-rose-600",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    iconText: "text-white",
    glow: "shadow-rose-500/25",
    ring: "group-hover:ring-rose-100",
    ambientBg: "from-rose-500/10 to-pink-500/5",
  },
  purple: {
    topBar: "from-purple-500 via-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    iconText: "text-white",
    glow: "shadow-purple-500/25",
    ring: "group-hover:ring-purple-100",
    ambientBg: "from-purple-500/10 to-violet-500/5",
  },
  slate: {
    topBar: "from-slate-600 via-slate-700 to-slate-800",
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-800",
    iconText: "text-white",
    glow: "shadow-slate-500/25",
    ring: "group-hover:ring-slate-200",
    ambientBg: "from-slate-500/10 to-slate-700/5",
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "indigo",
  description,
  trend,
  loading,
  onClick,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />

  const c = colorMap[color]

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white/95 backdrop-blur-xl border border-slate-200/80 ",
        "rounded-2xl p-5 shadow-xs transition-all duration-300 ease-out ",
        "hover:shadow-xl hover:shadow-slate-300/40 hover:border-slate-300 ",
        "hover:-translate-y-1 group overflow-hidden flex flex-col justify-between",
        onClick && "cursor-pointer"
      )}
    >
      {/* Top Color Accent Line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:h-[4px]",
          c.topBar
        )}
      />

      {/* Ambient Glow Background on Hover */}
      <div
        className={cn(
          "absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl",
          c.ambientBg
        )}
      />

      <div>
        {/* Header: Title & Icon */}
        <div className="relative flex items-center justify-between mb-3">
          <p className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider font-sans leading-none">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ring-4 ring-slate-100/80 group-hover:scale-110",
                c.iconBg,
                c.glow,
                c.ring
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", c.iconText)} strokeWidth={2.25} />
            </div>
          )}
        </div>

        {/* Metric Value & Trend Badge */}
        <div className="relative flex items-baseline gap-2 mt-1">
          <span className="text-[30px] font-black text-slate-900 tabular-nums tracking-tight leading-none">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded-full border shadow-xs",
                trend.positive
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-rose-700 bg-rose-50 border-rose-200"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Description Footnote */}
      {description && (
        <p className="relative text-[11.5px] text-slate-500 font-medium mt-3 leading-tight pt-2.5 border-t border-slate-100">
          {description}
        </p>
      )}
    </div>
  )
}
