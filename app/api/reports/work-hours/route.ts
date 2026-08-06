import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: {
      id: true, name: true, employeeId: true,
      department: true
    }
  })

  const allLogs = await prisma.attendanceLog.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      user: { role: "EMPLOYEE" }
    }
  })

  const report = employees.map(emp => {
    const empLogs = allLogs.filter(l => l.userId === emp.id)
    const presentLogs = empLogs.filter(l => l.loginTime !== null)

    const totalMinutes = empLogs.reduce((sum, l) => sum + l.netWorkMinutes, 0)
    const totalOvertimeMinutes = empLogs.reduce((sum, l) => sum + l.overtimeMinutes, 0)
    const lateArrivals = empLogs.filter(l => l.isLate).length

    // Calculate average login time
    const loginTimes = presentLogs
      .filter(l => l.loginTime)
      .map(l => {
        const d = new Date(l.loginTime!)
        return d.getHours() * 60 + d.getMinutes()
      })
    const avgLoginMinutes = loginTimes.length > 0
      ? Math.round(loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length)
      : null

    // Calculate average logout time
    const logoutTimes = presentLogs
      .filter(l => l.logoutTime)
      .map(l => {
        const d = new Date(l.logoutTime!)
        return d.getHours() * 60 + d.getMinutes()
      })
    const avgLogoutMinutes = logoutTimes.length > 0
      ? Math.round(logoutTimes.reduce((a, b) => a + b, 0) / logoutTimes.length)
      : null

    function minutesToTime(minutes: number | null): string {
      if (minutes === null) return "N/A"
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      const ampm = h >= 12 ? "PM" : "AM"
      const hour = h % 12 || 12
      return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
    }

    return {
      employee: emp,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      avgMinutesPerDay: presentLogs.length > 0 ? Math.round(totalMinutes / presentLogs.length) : 0,
      totalOvertimeMinutes,
      lateArrivals,
      daysPresent: presentLogs.length,
      avgLoginTime: minutesToTime(avgLoginMinutes),
      avgLogoutTime: minutesToTime(avgLogoutMinutes),
    }
  })

  // Sort by total hours descending
  report.sort((a, b) => b.totalMinutes - a.totalMinutes)

  const teamTotalMinutes = report.reduce((sum, r) => sum + r.totalMinutes, 0)
  const teamAvgMinutes = report.length > 0 ? Math.round(teamTotalMinutes / report.length) : 0

  return NextResponse.json({
    month, year,
    report,
    teamStats: {
      totalMinutes: teamTotalMinutes,
      avgMinutesPerEmployee: teamAvgMinutes,
      highestHours: report[0] || null,
      lowestHours: report[report.length - 1] || null,
    }
  })
}
