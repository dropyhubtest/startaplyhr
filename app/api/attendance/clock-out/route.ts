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
    },
    include: { breaks: true }
  })

  if (!attendanceLog) {
    return NextResponse.json({ error: "You have not clocked in today" }, { status: 400 })
  }

  if (attendanceLog.logoutTime) {
    return NextResponse.json({ error: "You have already clocked out today" }, { status: 400 })
  }

  const openBreak = attendanceLog.breaks.find(b => !b.breakEnd)
  let finalBreakMinutes = attendanceLog.totalBreakMinutes
  
  if (openBreak) {
    const breakDuration = Math.round((now.getTime() - new Date(openBreak.breakStart).getTime()) / 60000)
    await prisma.breakLog.update({
      where: { id: openBreak.id },
      data: {
        breakEnd: now,
        breakDurationMinutes: breakDuration,
      }
    })
    finalBreakMinutes += breakDuration
  }

  const loginTime = new Date(attendanceLog.loginTime!)
  const totalWorkMinutes = Math.round((now.getTime() - loginTime.getTime()) / 60000)
  const netWorkMinutes = Math.max(0, totalWorkMinutes - finalBreakMinutes)

  const settings = await prisma.companySettings.findFirst()
  const overtimeThreshold = settings?.overtimeAfterMinutes || 540
  const overtimeMinutes = Math.max(0, netWorkMinutes - overtimeThreshold)

  let finalStatus = attendanceLog.status
  if (netWorkMinutes < 240) {
    finalStatus = "HALFDAY"
  }

  const updated = await prisma.attendanceLog.update({
    where: { id: attendanceLog.id },
    data: {
      logoutTime: now,
      totalWorkMinutes,
      totalBreakMinutes: finalBreakMinutes,
      netWorkMinutes,
      overtimeMinutes,
      status: finalStatus,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CLOCK_OUT",
      details: `Clocked out at ${now.toLocaleTimeString()}. Net work: ${Math.floor(netWorkMinutes/60)}h ${netWorkMinutes%60}m`,
    }
  })

  try {
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "COMPLETED",
        logoutTime: now.toISOString(),
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  return NextResponse.json({
    success: true,
    summary: {
      loginTime: attendanceLog.loginTime,
      logoutTime: now,
      totalWorkMinutes,
      totalBreakMinutes: finalBreakMinutes,
      netWorkMinutes,
      overtimeMinutes,
      status: finalStatus,
      hoursWorked: `${Math.floor(netWorkMinutes/60)}h ${netWorkMinutes % 60}m`,
    }
  })
}
