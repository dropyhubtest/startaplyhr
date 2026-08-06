import { create } from "zustand"

interface NotificationItem {
  id: string
  title: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
}

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  setNotifications: (items: NotificationItem[]) => void
  addNotification: (item: NotificationItem) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setUnreadCount: (count: number) => void
}

export const useNotificationStore = create<NotificationState>()(
  (set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    
    setNotifications: (items) => set({ 
      notifications: items, 
      unreadCount: items.filter(n => !n.isRead).length 
    }),
    
    addNotification: (item) => set((s) => ({ 
      notifications: [item, ...s.notifications], 
      unreadCount: s.unreadCount + 1,
    })),
    
    markAsRead: (id) => set((s) => ({ 
      notifications: s.notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n 
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
    
    markAllAsRead: () => set((s) => ({ 
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
    
    setUnreadCount: (count) => set({ unreadCount: count }),
  })
)
