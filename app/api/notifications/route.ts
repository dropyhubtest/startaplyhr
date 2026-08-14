import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
