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
  const reportType = searchParams.get("type") || "attendance"
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  const employeeId = searchParams.get("employeeId") || "all"

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" })

  let csvContent = ""
  let filename = ""

  if (reportType === "attendance") {
    filename = `attendance-${monthName}-${year}.csv`
    
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)

    const countWorkingDays = (start: Date, end: Date): number => {
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
        select: { id: true, name: true, employeeId: true, department: true }
      })
      const allLogs = await prisma.attendanceLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      })

      csvContent = "Employee ID,Name,Department,Present,Absent,Late,Leave,Total Hours,Attendance Rate\n"
      
      employees.forEach(emp => {
        const logs = allLogs.filter(l => l.userId === emp.id)
        const present = logs.filter(l => l.status === "PRESENT" || l.status === "LATE").length
        const late = logs.filter(l => l.isLate).length
        const leave = logs.filter(l => l.status === "LEAVE").length
        const totalHours = (logs.reduce((s, l) => s + l.netWorkMinutes, 0) / 60).toFixed(1)
        const rate = totalWorkingDays > 0 ? `${Math.round((present / totalWorkingDays) * 100)}%` : '0%'
        
        csvContent += `${emp.employeeId},${emp.name},${emp.department},${present},${Math.max(0, totalWorkingDays-present)},${late},${leave},${totalHours},${rate}\n`
      })
    } else {
      filename = `attendance-employee-${monthName}-${year}.csv`
      const logs = await prisma.attendanceLog.findMany({
        where: {
          userId: employeeId,
          date: { gte: monthStart, lte: monthEnd }
        },
        orderBy: { date: "asc" }
      })

      csvContent = "Date,Login Time,Logout Time,Work Hours,Break Minutes,Status,Late\n"
      logs.forEach(log => {
        const date = new Date(log.date).toLocaleDateString("en-IN")
        const login = log.loginTime ? new Date(log.loginTime).toLocaleTimeString() : "-"
        const logout = log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString() : "-"
        const hours = (log.netWorkMinutes / 60).toFixed(1)
        csvContent += `${date},${login},${logout},${hours}h,${log.totalBreakMinutes},${log.status},${log.isLate}\n`
      })
    }
  } else if (reportType === "work-hours") {
    filename = `work-hours-${monthName}-${year}.csv`
    csvContent = "Employee ID,Name,Department,Total Hours,Avg Hours/Day,Overtime Hours,Late Arrivals,Avg Login,Avg Logout\n"
    
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, employeeId: true, department: true }
    })
    const logs = await prisma.attendanceLog.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } }
    })

    employees.forEach(emp => {
      const empLogs = logs.filter(l => l.userId === emp.id)
      const totalHours = (empLogs.reduce((s, l) => s + l.netWorkMinutes, 0) / 60).toFixed(1)
      const overtimeHours = (empLogs.reduce((s, l) => s + l.overtimeMinutes, 0) / 60).toFixed(1)
      const lateCount = empLogs.filter(l => l.isLate).length
      const avgHours = empLogs.length > 0
        ? (parseFloat(totalHours) / empLogs.length).toFixed(1)
        : "0"
      
      csvContent += `${emp.employeeId},${emp.name},${emp.department},${totalHours}h,${avgHours}h,${overtimeHours}h,${lateCount},-,-\n`
    })
  } else if (reportType === "performance") {
    filename = `performance-${monthName}-${year}.csv`
    csvContent = "Employee ID,Name,Department,Attendance%,Tasks Assigned,Tasks Completed,Completion Rate,On-Time Rate,Overall Score,Grade\n"
    
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)

    const countWorkingDays = (start: Date, end: Date): number => {
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

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, employeeId: true, department: true }
    })
    const [logs, tasks] = await Promise.all([
      prisma.attendanceLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      }),
      prisma.task.findMany({
        where: { assignedToId: { in: employees.map(e => e.id) } }
      })
    ])

    employees.forEach(emp => {
      const empLogs = logs.filter(l => l.userId === emp.id)
      const empTasks = tasks.filter(t => t.assignedToId === emp.id)
      const present = empLogs.filter(l => l.status === "PRESENT" || l.status === "LATE").length
      const attendancePct = totalWorkingDays > 0 ? `${Math.round((present/totalWorkingDays)*100)}%` : '0%'
      const completed = empTasks.filter(t => t.status === "COMPLETED").length
      const completionRate = empTasks.length > 0 ? `${Math.round((completed/empTasks.length)*100)}%` : "100%"
      
      csvContent += `${emp.employeeId},${emp.name},${emp.department},${attendancePct},${empTasks.length},${completed},${completionRate},100%,--,--\n`
    })
  }

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
