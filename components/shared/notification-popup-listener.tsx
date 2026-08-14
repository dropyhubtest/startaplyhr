"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { pusherClient } from "@/lib/pusher"
import { toast } from "sonner"
import { Bell, CalendarCheck, CalendarX, CheckSquare, Megaphone, X } from "lucide-react"

interface NotificationPayload {
  id?: string
  title: string
  message: string
  type?: string
  createdAt?: string
}

export function NotificationPopupListener() {
  const { user, isAuthenticated } = useAuth()
  const shownIdsRef = useRef<Set<string>>(new Set())

  const showPopup = (notif: NotificationPayload) => {
    if (notif.id && shownIdsRef.current.has(notif.id)) return
    if (notif.id) shownIdsRef.current.add(notif.id)

    toast.custom((t) => {
      const type = notif.type || "GENERAL"

      let IconComponent = Bell
      let iconStyle = "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"

      if (type === "LEAVE_APPROVED") {
        IconComponent = CalendarCheck
        iconStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      } else if (type === "LEAVE_REJECTED") {
        IconComponent = CalendarX
        iconStyle = "bg-rose-500/20 text-rose-400 border-rose-500/30"
      } else if (type === "TASK_ASSIGNED") {
        IconComponent = CheckSquare
        iconStyle = "bg-blue-500/20 text-blue-400 border-blue-500/30"
      } else if (type === "ANNOUNCEMENT") {
        IconComponent = Megaphone
        iconStyle = "bg-purple-500/20 text-purple-400 border-purple-500/30"
      }

      return (
        <div className="w-full max-w-sm bg-slate-900/95 text-white backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 animate-in slide-in-from-top-4 duration-300">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconStyle}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[14px] font-bold text-white tracking-tight truncate">
                {notif.title}
              </h4>
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 flex-shrink-0">
                Just now
              </span>
            </div>
            <p className="text-[12.5px] text-slate-300 mt-1 leading-snug break-words">
              {notif.message}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }, { duration: 6000 })
  }

  // Real-time Pusher listener
  useEffect(() => {
    if (!user?.id) return

    const channelName = `employee-${user.id}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind("new-notification", (data: NotificationPayload) => {
      showPopup(data)
    })

    return () => {
      pusherClient.unsubscribe(channelName)
    }
  }, [user?.id])

  // Periodic check for new unread notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          const unread = (data.notifications || []).filter((n: any) => !n.isRead)
          const recentThreshold = new Date(Date.now() - 15000)
          unread.forEach((n: any) => {
            if (new Date(n.createdAt) >= recentThreshold) {
              showPopup(n)
            }
          })
        }
      } catch (e) {
        // Silent catch
      }
    }

    const interval = setInterval(checkNotifications, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.id])

  return null
}
