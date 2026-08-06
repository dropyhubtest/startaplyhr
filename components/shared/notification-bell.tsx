"use client"

import { useState } from "react"
import { Bell, Calendar, CheckSquare, Megaphone, Clock } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/hooks/use-notifications"
import { NoNotifications } from "./empty-state"
import { cn } from "@/lib/utils"

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return "Yesterday"
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id)
    }
  }

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "LEAVE_APPROVED":
        return { icon: Calendar, color: "bg-green-100 text-green-600" }
      case "LEAVE_REJECTED":
        return { icon: Calendar, color: "bg-red-100 text-red-600" }
      case "TASK_ASSIGNED":
        return { icon: CheckSquare, color: "bg-blue-100 text-blue-600" }
      case "ANNOUNCEMENT":
        return { icon: Megaphone, color: "bg-indigo-100 text-indigo-600" }
      case "ATTENDANCE_ALERT":
        return { icon: Clock, color: "bg-orange-100 text-orange-600" }
      case "GENERAL":
      default:
        return { icon: Bell, color: "bg-gray-100 text-gray-600" }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="relative p-2 rounded-full hover:bg-gray-100 transition-colors outline-none cursor-pointer">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-[380px] p-0 rounded-xl shadow-lg border-gray-100">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        
        <Separator className="bg-gray-100" />
        
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
          {notifications.length === 0 ? (
            <div className="py-4">
              <NoNotifications />
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notif) => {
                const { icon: Icon, color } = getIconAndColor(notif.type)
                
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                    className="flex gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors group relative"
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 pr-6">
                      <p className={cn("text-sm font-medium", notif.isRead ? "text-gray-700" : "text-gray-900")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <Separator className="bg-gray-100" />
            <div className="p-3 text-center">
              <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                View all notifications
              </a>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
