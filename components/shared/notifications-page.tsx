"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { NotificationItem, Notification } from "@/components/shared/notification-item"
import { toast } from "sonner"
import { Bell, CheckCheck, Loader2, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications)
      }
    } catch (e) {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" })
      if (!res.ok) throw new Error()
    } catch (e) {
      toast.error("Failed to mark as read")
      fetchNotifications() // Revert on failure
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      const res = await fetch("/api/notifications/read-all", { method: "PUT" })
      if (!res.ok) throw new Error()
      toast.success("All notifications marked as read")
    } catch (e) {
      toast.error("Failed to mark all as read")
      fetchNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.isRead
    if (filter === "read") return n.isRead
    if (typeFilter !== "ALL") return n.type === typeFilter
    return true
  })

  const types = ["ALL", "LEAVE_APPROVED", "LEAVE_REJECTED", "TASK_ASSIGNED", "ANNOUNCEMENT", "ATTENDANCE_ALERT"]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Notifications"
        description="All your notifications and alerts in one place"
      />

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/70 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/50 w-fit">
            {(["all", "unread", "read"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "capitalize px-4 py-1.5 rounded-md text-[13px] font-medium transition-all flex items-center gap-2",
                  filter === f 
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {f}
                {f === "unread" && unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4 text-indigo-600" />}
            Mark all as read
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-2 flex-wrap">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "text-[12px] px-3 py-1.5 rounded-md font-bold transition-all border",
                  typeFilter === type
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                )}
              >
                {type === "ALL" ? "All Types" : type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={notifications.length === 0 ? "You're all caught up! No notifications yet." : "No notifications match your current filters."}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
