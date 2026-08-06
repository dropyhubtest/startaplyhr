import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const attendanceLog = await prisma.attendanceLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: todayStart }
    }
  })

  if (!attendanceLog) {
    return NextResponse.json({ error: "You have not clocked in today" }, { status: 400 })
  }

  if (attendanceLog.logoutTime) {
    return NextResponse.json({ error: "You have already clocked out" }, { status: 400 })
  }

  const openBreak = await prisma.breakLog.findFirst({
    where: {
      attendanceLogId: attendanceLog.id,
      breakEnd: null
    }
  })

  if (openBreak) {
    return NextResponse.json({ error: "You are already on a break" }, { status: 400 })
  }

  const breakLog = await prisma.breakLog.create({
    data: {
      attendanceLogId: attendanceLog.id,
      userId: session.user.id,
      breakStart: now,
    }
  })

  try {
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "ON_BREAK",
        breakStartTime: now.toISOString(),
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  return NextResponse.json({ success: true, breakLog, message: "Break started" })
}
