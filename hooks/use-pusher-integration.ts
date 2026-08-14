import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { pusherClient } from "@/lib/pusher"

export function usePusherIntegration(userId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    try {
      // Admin dashboard channel
      const adminChannel = pusherClient.subscribe("hr-dashboard")

      adminChannel.bind("employee-status-changed", () => {
        queryClient.invalidateQueries({ queryKey: ["live-status"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        queryClient.invalidateQueries({ queryKey: ["attendance"] })
      })

      adminChannel.bind("new-leave-request", () => {
        queryClient.invalidateQueries({ queryKey: ["leaves"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      })

      // User personal channel
      const userChannel = pusherClient.subscribe(`employee-${userId}`)

      userChannel.bind("new-notification", () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      })

      userChannel.bind("task-assigned", () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
        queryClient.invalidateQueries({ queryKey: ["task-stats"] })
      })

      return () => {
        pusherClient.unsubscribe("hr-dashboard")
        pusherClient.unsubscribe(`employee-${userId}`)
      }
    } catch (e) {
      console.warn("Pusher subscription error:", e)
    }
  }, [userId, queryClient])
}
