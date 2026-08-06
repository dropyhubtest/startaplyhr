import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Total and active employees
    const totalEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE" }
    })
    
    const activeEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true }
    })

    // Present today (PRESENT or LATE status)
    const presentToday = await prisma.attendanceLog.count({
      where: {
        date: { gte: today, lte: todayEnd },
        status: { in: ["PRESENT", "LATE"] }
      }
    })

    // On break now (has open break log today)
    const onBreakNow = await prisma.breakLog.count({
      where: {
        breakStart: { gte: today },
        breakEnd: null
      }
    })

    // On leave today (approved leave covering today)
    const onLeaveToday = await prisma.leave.count({
      where: {
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: today }
      }
    })

    // Absent today
    const presentAndLeaveIds = await prisma.attendanceLog.findMany({
      where: { date: { gte: today, lte: todayEnd } },
      select: { userId: true }
    })
    const leaveUserIds = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: today }
      },
      select: { userId: true }
    })
    const accountedIds = Array.from(new Set([
      ...presentAndLeaveIds.map(a => a.userId),
      ...leaveUserIds.map(l => l.userId)
    ]))
    const absentToday = Math.max(
      0, 
      activeEmployees - accountedIds.length
    )

    // Pending leave requests
    const pendingLeaveRequests = await prisma.leave.count({
      where: { status: "PENDING" }
    })

    // Tasks due today
    const tasksDueToday = await prisma.task.count({
      where: {
        deadline: { gte: today, lte: todayEnd },
        status: { not: "COMPLETED" }
      }
    })

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      presentToday,
      onBreakNow,
      absentToday,
      onLeaveToday,
      pendingLeaveRequests,
      tasksDueToday
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
