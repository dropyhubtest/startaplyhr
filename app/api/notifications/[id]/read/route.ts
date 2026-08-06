import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NOTIFICATION_READ]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
