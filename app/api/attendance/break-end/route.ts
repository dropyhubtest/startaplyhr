import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

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
    return NextResponse.json({ error: "No attendance log found" }, { status: 400 })
  }

  const openBreak = await prisma.breakLog.findFirst({
    where: {
      attendanceLogId: attendanceLog.id,
      breakEnd: null
    }
  })

  if (!openBreak) {
    return NextResponse.json({ error: "No active break found" }, { status: 400 })
  }

  const breakDuration = Math.round((now.getTime() - new Date(openBreak.breakStart).getTime()) / 60000)

  const breakLog = await prisma.breakLog.update({
    where: { id: openBreak.id },
    data: {
      breakEnd: now,
      breakDurationMinutes: breakDuration,
    }
  })

  await prisma.attendanceLog.update({
    where: { id: attendanceLog.id },
    data: {
      totalBreakMinutes: {
        increment: breakDuration
      }
    }
  })

  const settings = await prisma.companySettings.findFirst()
  const maxBreak = settings?.maxBreakMinutes || 60
  const totalBreaks = attendanceLog.totalBreakMinutes + breakDuration

  if (totalBreaks > maxBreak) {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Break Limit Exceeded",
          message: `An employee has exceeded the ${maxBreak} minute break limit today.`,
          type: "ATTENDANCE_ALERT",
          isRead: false,
        }
      })
    }
  }

  try {
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "WORKING",
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  sendNotification(
    session.user.id,
    "Break Ended ⚡",
    `Break duration: ${breakDuration} minutes. Welcome back!`,
    "ATTENDANCE_ALERT"
  ).catch(() => {})

  return NextResponse.json({
    success: true,
    breakLog,
    breakDuration,
    totalBreakToday: totalBreaks,
    exceededLimit: totalBreaks > maxBreak,
    message: `Break ended. Duration: ${breakDuration} minutes`
  })
}
