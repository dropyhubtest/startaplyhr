import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Batch-fetch ALL data in 4 parallel queries instead of 2N+1 sequential queries
    const [employees, todayLogs, todayLeaves, todayBreaks] = await Promise.all([
      prisma.user.findMany({
        where: { role: "EMPLOYEE", isActive: true },
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          department: true,
          jobTitle: true,
        },
      }),
      prisma.attendanceLog.findMany({
        where: { date: { gte: today, lte: todayEnd } },
        include: { breaks: true },
      }),
      prisma.leave.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: todayEnd },
          endDate: { gte: today },
        },
        select: { userId: true },
      }),
      prisma.breakLog.findMany({
        where: { breakStart: { gte: today } },
        select: { id: true, userId: true, attendanceLogId: true, breakStart: true, breakEnd: true, breakDurationMinutes: true },
      }),
    ])

    // Index data by userId for O(1) lookups
    const logByUser = new Map<string, (typeof todayLogs)[0]>()
    for (const log of todayLogs) {
      logByUser.set(log.userId, log)
    }

    const leaveUserIds = new Set(todayLeaves.map((l) => l.userId))

    // Build live status in-memory — zero additional DB queries
    const liveStatus = employees.map((emp) => {
      // Check leave
      if (leaveUserIds.has(emp.id)) {
        return {
          ...emp,
          userId: emp.id,
          status: "ON_LEAVE",
          loginTime: null,
          hoursWorkedToday: 0,
          breakTimeToday: 0,
        }
      }

      const log = logByUser.get(emp.id)

      if (!log) {
        return {
          ...emp,
          userId: emp.id,
          status: "ABSENT",
          loginTime: null,
          hoursWorkedToday: 0,
          breakTimeToday: 0,
        }
      }

      // Status determination
      let status = "WORKING"
      const isOpenBreak = log.breaks.some((b) => !b.breakEnd)

      if (isOpenBreak) {
        status = "ON_BREAK"
      } else if (log.logoutTime) {
        status = "COMPLETED"
      }

      // Break time calculation
      let breakTimeToday = 0
      const now = new Date()
      for (const b of log.breaks) {
        if (b.breakEnd) {
          breakTimeToday +=
            (b.breakEnd.getTime() - b.breakStart.getTime()) / (1000 * 60)
        } else {
          breakTimeToday +=
            (now.getTime() - b.breakStart.getTime()) / (1000 * 60)
        }
      }

      // Hours worked calculation
      let hoursWorkedToday = 0
      if (status === "COMPLETED" && log.netWorkMinutes) {
        hoursWorkedToday = log.netWorkMinutes
      } else if (log.loginTime) {
        hoursWorkedToday =
          (now.getTime() - log.loginTime.getTime()) / (1000 * 60) -
          breakTimeToday
      }

      return {
        ...emp,
        userId: emp.id,
        status,
        loginTime: log.loginTime,
        hoursWorkedToday: Math.max(0, Math.round(hoursWorkedToday)),
        breakTimeToday: Math.round(breakTimeToday),
      }
    })

    // Sort by status priority
    const statusOrder: Record<string, number> = {
      WORKING: 1,
      ON_BREAK: 2,
      COMPLETED: 3,
      ON_LEAVE: 4,
      ABSENT: 5,
    }

    liveStatus.sort(
      (a, b) => (statusOrder[a.status] ?? 6) - (statusOrder[b.status] ?? 6)
    )

    return NextResponse.json(liveStatus)
  } catch (error) {
    console.error("Live status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
