import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export async function PUT() {
  try {
    const session = await requireAuth()
    
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NOTIFICATIONS_READ_ALL]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
