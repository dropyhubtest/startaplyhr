import Pusher from "pusher"
import PusherClient from "pusher-js"

// Server side Pusher
export const pusher = (process.env.PUSHER_APP_ID && process.env.PUSHER_APP_ID !== "placeholder-app-id")
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY || "",
      secret: process.env.PUSHER_SECRET || "",
      cluster: process.env.PUSHER_CLUSTER || "mt1",
      useTLS: true,
    })
  : ({
      trigger: async () => {},
    } as unknown as Pusher)

// Client side Pusher
const mockPusherClient = {
  subscribe: () => ({
    bind: () => {},
    unbind: () => {},
    unbind_all: () => {},
  }),
  unsubscribe: () => {},
  bind: () => {},
  unbind: () => {},
} as unknown as PusherClient

export const pusherClient = (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_KEY !== "placeholder-key")
  ? new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      }
    )
  : mockPusherClient

// Pusher channels to use:
// "hr-dashboard" channel for admin updates
// "employee-{userId}" channel for employee notifications

// Events:
// "employee-status-changed" - when employee logs in/out/break
// "leave-request-update" - when leave approved/rejected
// "task-assigned" - when new task assigned
// "new-announcement" - when announcement posted
// "new-notification" - when notification sent
