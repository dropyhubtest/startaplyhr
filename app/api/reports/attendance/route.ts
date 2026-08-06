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
  const employeeId = searchParams.get("employeeId") || "all"
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  function countWorkingDays(start: Date, end: Date): number {
    let count = 0
    const current = new Date(start)
    const today = new Date()
    const endDate = end > today ? today : end
    while (current <= endDate) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }
  const totalWorkingDays = countWorkingDays(monthStart, monthEnd)

  if (employeeId === "all") {
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: {
        id: true, name: true, employeeId: true,
        department: true, profilePhoto: true
      }
    })

    const allLogs = await prisma.attendanceLog.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        user: { role: "EMPLOYEE" }
      }
    })

    const employeeSummaries = employees.map(emp => {
      const empLogs = allLogs.filter(l => l.userId === emp.id)
      const present = empLogs.filter(
        l => l.status === "PRESENT" || l.status === "LATE"
      ).length
      const absent = totalWorkingDays - present - 
        empLogs.filter(l => l.status === "LEAVE").length
      const late = empLogs.filter(l => l.isLate).length
      const leave = empLogs.filter(l => l.status === "LEAVE").length
      const totalMinutes = empLogs.reduce((sum, l) => sum + l.netWorkMinutes, 0)
      const avgMinutes = empLogs.length > 0
        ? Math.round(totalMinutes / empLogs.length) : 0
      const attendanceRate = totalWorkingDays > 0
        ? Math.round((present / totalWorkingDays) * 100) : 0

      return {
        employee: emp,
        present,
        absent: Math.max(0, absent),
        late,
        leave,
        halfDay: empLogs.filter(l => l.status === "HALFDAY").length,
        totalMinutes,
        avgMinutesPerDay: avgMinutes,
        attendanceRate,
        totalWorkingDays,
      }
    })

    return NextResponse.json({
      type: "all",
      month, year,
      totalWorkingDays,
      employeeSummaries,
    })
  } else {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true, name: true, employeeId: true,
        department: true, jobTitle: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const logs = await prisma.attendanceLog.findMany({
      where: {
        userId: employeeId,
        date: { gte: monthStart, lte: monthEnd }
      },
      include: { breaks: true },
      orderBy: { date: "asc" }
    })

    const present = logs.filter(
      l => l.status === "PRESENT" || l.status === "LATE"
    ).length
    const absent = Math.max(0, totalWorkingDays - logs.filter(l => l.status !== "ABSENT").length)
    const totalMinutes = logs.reduce((sum, l) => sum + l.netWorkMinutes, 0)

    const summary = {
      present,
      absent,
      late: logs.filter(l => l.isLate).length,
      leave: logs.filter(l => l.status === "LEAVE").length,
      halfDay: logs.filter(l => l.status === "HALFDAY").length,
      totalMinutes,
      totalOvertimeMinutes: logs.reduce((sum, l) => sum + l.overtimeMinutes, 0),
      avgMinutesPerDay: logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0,
      attendanceRate: totalWorkingDays > 0 ? Math.round((present / totalWorkingDays) * 100) : 0,
      totalWorkingDays,
    }

    return NextResponse.json({
      type: "single",
      month, year,
      employee,
      summary,
      dailyLogs: logs,
    })
  }
}
