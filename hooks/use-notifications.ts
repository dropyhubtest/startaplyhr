"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/store/notification-store"
import { pusherClient } from "@/lib/pusher"
import { useAuth } from "./use-auth"

export function useNotifications() {
  const store = useNotificationStore()
  const { user, isAuthenticated } = useAuth()

  // Fetch notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          store.setNotifications(data.notifications || [])
        } else if (res.status === 401) {
          store.setNotifications([])
        }
      } catch (error) {
        // Silent catch for network transitions
      }
    }

    if (isAuthenticated && user?.id) {
      fetchNotifications()
    }
  }, [isAuthenticated, user?.id])

  // Subscribe to Pusher for real time
  useEffect(() => {
    if (!user?.id) return

    const channel = pusherClient.subscribe(`employee-${user.id}`)
    
    channel.bind("new-notification", (data: any) => {
      store.addNotification(data)
    })

    return () => {
      pusherClient.unsubscribe(`employee-${user.id}`)
    }
  }, [user?.id])

  const markAsRead = async (id: string) => {
    store.markAsRead(id)
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" })
  }

  const markAllAsRead = async () => {
    store.markAllAsRead()
    await fetch("/api/notifications/read-all", { method: "PUT" })
  }

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    markAsRead,
    markAllAsRead,
  }
}
