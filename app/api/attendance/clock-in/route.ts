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
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.attendanceLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: todayStart, lte: todayEnd }
    }
  })

  if (existing) {
    return NextResponse.json({ error: "Already clocked in today" }, { status: 400 })
  }

  const onLeave = await prisma.leave.findFirst({
    where: {
      userId: session.user.id,
      status: "APPROVED",
      startDate: { lte: todayEnd },
      endDate: { gte: todayStart }
    }
  })

  if (onLeave) {
    return NextResponse.json({ error: "You are on approved leave today" }, { status: 400 })
  }

  const settings = await prisma.companySettings.findFirst()
  const workStartTime = settings?.workStartTime || "09:00"
  const lateThreshold = settings?.lateThresholdMinutes || 30

  const [startHour, startMin] = workStartTime.split(":").map(Number)
  const workStartDate = new Date(now)
  workStartDate.setHours(startHour, startMin, 0, 0)
  
  const lateDeadline = new Date(workStartDate)
  lateDeadline.setMinutes(lateDeadline.getMinutes() + lateThreshold)
  
  const isLate = now > lateDeadline
  const status = isLate ? "LATE" : "PRESENT"

  const attendanceLog = await prisma.attendanceLog.create({
    data: {
      userId: session.user.id,
      date: todayStart,
      loginTime: now,
      status,
      isLate,
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      netWorkMinutes: 0,
      overtimeMinutes: 0,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CLOCK_IN",
      details: `Clocked in at ${now.toLocaleTimeString()}${isLate ? " (LATE)" : ""}`,
    }
  })

  try {
    const { pusherClient } = await import("@/lib/pusher")
    // Note: server-side triggering usually uses `pusher` server instance, 
    // but the spec suggests `@/lib/pusher`. If it exposes `pusher` (server client):
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "WORKING",
        loginTime: now.toISOString(),
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  return NextResponse.json({
    success: true,
    attendanceLog,
    isLate,
    message: isLate ? `Clocked in (Late by ${Math.round((now.getTime() - lateDeadline.getTime()) / 60000)} minutes)` : "Clocked in successfully"
  })
}
