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

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, profilePhoto: true, department: true, jobTitle: true }
    })

    const liveStatus = await Promise.all(employees.map(async (emp) => {
      // 1. Check if on approved leave
      const leave = await prisma.leave.findFirst({
        where: {
          userId: emp.id,
          status: "APPROVED",
          startDate: { lte: todayEnd },
          endDate: { gte: today }
        }
      })
      if (leave) {
        return { ...emp, userId: emp.id, status: "ON_LEAVE", loginTime: null, hoursWorkedToday: 0, breakTimeToday: 0 }
      }

      // 2. Check today's attendance log
      const log = await prisma.attendanceLog.findFirst({
        where: { userId: emp.id, date: { gte: today, lte: todayEnd } },
        include: { breaks: true }
      })

      if (!log) {
        return { ...emp, userId: emp.id, status: "ABSENT", loginTime: null, hoursWorkedToday: 0, breakTimeToday: 0 }
      }

      // 3. Status determination & time calculations
      let status = "WORKING"
      const isOpenBreak = log.breaks.some(b => !b.breakEnd)
      
      if (isOpenBreak) {
        status = "ON_BREAK"
      } else if (log.logoutTime) {
        status = "COMPLETED"
      }

      let breakTimeToday = 0
      log.breaks.forEach(b => {
        if (b.breakEnd) {
          breakTimeToday += (b.breakEnd.getTime() - b.breakStart.getTime()) / (1000 * 60)
        } else {
          breakTimeToday += (new Date().getTime() - b.breakStart.getTime()) / (1000 * 60)
        }
      })

      let hoursWorkedToday = 0
      if (status === "COMPLETED" && log.netWorkMinutes) {
        hoursWorkedToday = log.netWorkMinutes
      } else if (log.loginTime) {
        hoursWorkedToday = ((new Date().getTime() - log.loginTime.getTime()) / (1000 * 60)) - breakTimeToday
      }

      return {
        ...emp,
        userId: emp.id,
        status,
        loginTime: log.loginTime,
        hoursWorkedToday: Math.max(0, Math.round(hoursWorkedToday)),
        breakTimeToday: Math.round(breakTimeToday)
      }
    }))

    // Sort order
    const statusOrder: Record<string, number> = {
      "WORKING": 1,
      "ON_BREAK": 2,
      "COMPLETED": 3,
      "ON_LEAVE": 4,
      "ABSENT": 5
    }

    liveStatus.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    return NextResponse.json(liveStatus)
  } catch (error) {
    console.error("Live status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
