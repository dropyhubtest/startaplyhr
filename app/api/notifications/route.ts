import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAuth()
    
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
