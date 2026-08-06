import { cn, timeAgo } from "@/lib/utils"
import { CheckCircle, XCircle, CheckSquare, Megaphone, Clock, Bell } from "lucide-react"

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string | Date
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

const typeConfig: Record<string, any> = {
  LEAVE_APPROVED: { 
    icon: CheckCircle, 
    bgColor: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
  },
  LEAVE_REJECTED: { 
    icon: XCircle, 
    bgColor: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
  },
  TASK_ASSIGNED: { 
    icon: CheckSquare, 
    bgColor: "bg-indigo-50 border-indigo-100",
    iconColor: "text-indigo-600",
  },
  ANNOUNCEMENT: { 
    icon: Megaphone, 
    bgColor: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
  },
  ATTENDANCE_ALERT: { 
    icon: Clock, 
    bgColor: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-600",
  },
  GENERAL: { 
    icon: Bell, 
    bgColor: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
  },
}

export function NotificationItem({
  notification,
  onMarkRead
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.GENERAL
  const Icon = config.icon

  return (
    <div
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      className={cn(
        "flex gap-4 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
        !notification.isRead && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        notification.isRead 
          ? "bg-white border-slate-200" 
          : "bg-indigo-50/30 border-indigo-200/60 shadow-sm"
      )}
    >
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
      )}
      
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
        config.bgColor
      )}>
        <Icon className={cn("w-5 h-5", config.iconColor)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-[14px]",
            notification.isRead 
              ? "text-slate-700 font-semibold" 
              : "text-slate-900 font-bold"
          )}>
            {notification.title}
          </p>
          <span className="text-[11px] font-medium text-slate-400 flex-shrink-0 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
          {notification.message}
        </p>
        
        {!notification.isRead && (
          <span className="text-[11px] text-indigo-600 mt-2 font-bold inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            Click to mark as read
          </span>
        )}
      </div>
      
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-indigo-500/30" />
      )}
    </div>
  )
}
