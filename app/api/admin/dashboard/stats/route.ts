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

    // Run ALL queries in parallel instead of sequentially
    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      onBreakNow,
      onLeaveToday,
      presentAndLeaveIds,
      leaveUserIds,
      pendingLeaveRequests,
      tasksDueToday,
      recentAssets,
      allEmployeesWithDob,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
      prisma.attendanceLog.count({
        where: {
          date: { gte: today, lte: todayEnd },
          status: { in: ["PRESENT", "LATE"] },
        },
      }),
      prisma.breakLog.count({
        where: { breakStart: { gte: today }, breakEnd: null },
      }),
      prisma.leave.count({
        where: {
          status: "APPROVED",
          startDate: { lte: todayEnd },
          endDate: { gte: today },
        },
      }),
      prisma.attendanceLog.findMany({
        where: { date: { gte: today, lte: todayEnd } },
        select: { userId: true },
      }),
      prisma.leave.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: todayEnd },
          endDate: { gte: today },
        },
        select: { userId: true },
      }),
      prisma.leave.count({ where: { status: "PENDING" } }),
      prisma.task.count({
        where: {
          deadline: { gte: today, lte: todayEnd },
          status: { not: "COMPLETED" },
        },
      }),
      prisma.assetAssignment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, employeeId: true, department: true },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          role: "EMPLOYEE",
          isActive: true,
          dateOfBirth: { not: null },
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          dateOfBirth: true,
          department: true,
        },
      }),
    ])

    // Calculate upcoming birthdays in next 7 days
    const upcomingBirthdays = (allEmployeesWithDob || [])
      .filter((emp: any) => {
        if (!emp.dateOfBirth) return false
        const dob = new Date(emp.dateOfBirth)
        const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        if (birthdayThisYear < today) {
          birthdayThisYear.setFullYear(today.getFullYear() + 1)
        }
        const diffDays = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 3600 * 24))
        return diffDays >= 0 && diffDays <= 7
      })
      .map((emp: any) => {
        const dob = new Date(emp.dateOfBirth!)
        return {
          id: emp.id,
          name: emp.name,
          employeeId: emp.employeeId,
          department: emp.department,
          birthday: `${dob.getDate()} ${dob.toLocaleString('default', { month: 'short' })}`,
        }
      })

    const accountedIds = new Set([
      ...presentAndLeaveIds.map((a) => a.userId),
      ...leaveUserIds.map((l) => l.userId),
    ])
    const absentToday = Math.max(0, activeEmployees - accountedIds.size)

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      presentToday,
      onBreakNow,
      absentToday,
      onLeaveToday,
      pendingLeaveRequests,
      tasksDueToday,
      recentAssets,
      upcomingBirthdays,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
