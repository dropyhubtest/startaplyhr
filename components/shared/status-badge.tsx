import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  size?: "sm" | "md"
  showDot?: boolean
}

const config: Record<string, { 
  bg: string, text: string, dot: string, label?: string 
}> = {
  ONLINE: { bg: "bg-green-50", text: "text-green-700", 
    dot: "bg-green-500", label: "Online" },
  WORKING: { bg: "bg-green-50", text: "text-green-700", 
    dot: "bg-green-500", label: "Working" },
  PRESENT: { bg: "bg-green-50", text: "text-green-700", 
    dot: "bg-green-500", label: "Present" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700", 
    dot: "bg-green-500", label: "Approved" },
  COMPLETED: { bg: "bg-zinc-100", text: "text-zinc-700", 
    dot: "bg-zinc-500", label: "Completed" },
  ON_BREAK: { bg: "bg-orange-50", text: "text-orange-700", 
    dot: "bg-orange-500", label: "On break" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", 
    dot: "bg-amber-500", label: "Pending" },
  INPROGRESS: { bg: "bg-blue-50", text: "text-blue-700", 
    dot: "bg-blue-500", label: "In progress" },
  OFFLINE: { bg: "bg-zinc-100", text: "text-zinc-600", 
    dot: "bg-zinc-400", label: "Offline" },
  HALFDAY: { bg: "bg-zinc-100", text: "text-zinc-700", 
    dot: "bg-zinc-500", label: "Half day" },
  CANCELLED: { bg: "bg-zinc-100", text: "text-zinc-600", 
    dot: "bg-zinc-400", label: "Cancelled" },
  ABSENT: { bg: "bg-red-50", text: "text-red-700", 
    dot: "bg-red-500", label: "Absent" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", 
    dot: "bg-red-500", label: "Rejected" },
  BLOCKED: { bg: "bg-red-50", text: "text-red-700", 
    dot: "bg-red-500", label: "Blocked" },
  ON_LEAVE: { bg: "bg-blue-50", text: "text-blue-700", 
    dot: "bg-blue-500", label: "On leave" },
  LEAVE: { bg: "bg-blue-50", text: "text-blue-700", 
    dot: "bg-blue-500", label: "Leave" },
  WFH: { bg: "bg-purple-50", text: "text-purple-700", 
    dot: "bg-purple-500", label: "WFH" },
  LATE: { bg: "bg-orange-50", text: "text-orange-700", 
    dot: "bg-orange-500", label: "Late" },
  HIGH: { bg: "bg-red-50", text: "text-red-700", 
    dot: "bg-red-500", label: "High" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", 
    dot: "bg-amber-500", label: "Medium" },
  LOW: { bg: "bg-zinc-100", text: "text-zinc-600", 
    dot: "bg-zinc-400", label: "Low" },
  TODO: { bg: "bg-zinc-100", text: "text-zinc-600", 
    dot: "bg-zinc-400", label: "Todo" },
  NOT_STARTED: { bg: "bg-zinc-100", text: "text-zinc-600", 
    dot: "bg-zinc-400", label: "Not started" },
}

export function StatusBadge({ 
  status, size = "sm", showDot = true 
}: StatusBadgeProps) {
  const s = config[status] || config.OFFLINE
  const shouldPulse = status === "WORKING" || 
    status === "ONLINE" || status === "ON_BREAK"

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md",
      "font-medium border border-transparent",
      s.bg, s.text,
      size === "sm" && "text-[11px] px-1.5 py-0.5",
      size === "md" && "text-[12px] px-2 py-1",
    )}>
      {showDot && (
        <span className="relative flex">
          <span className={cn(
            "rounded-full",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            s.dot
          )} />
          {shouldPulse && (
            <span className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-60",
              size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
              s.dot
            )} />
          )}
        </span>
      )}
      {s.label || status}
    </span>
  )
}
