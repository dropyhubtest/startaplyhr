import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function minutesToTime(minutes: number | null): string {
  if (minutes === null) return "N/A"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

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
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  let csvContent = ""
  let filename = ""

  if (reportType === "attendance") {
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
      filename = `attendance-${monthName}-${year}.csv`
      const employees = await prisma.user.findMany({
        where: { role: "EMPLOYEE", isActive: true },
        select: { id: true, name: true, employeeId: true, department: true }
      })
      const allLogs = await prisma.attendanceLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      })

      csvContent = "Employee ID,Name,Department,Present,Absent,Late,Leave,Total Work Hours,Total Distance (km),Attendance Rate\n"

      employees.forEach((emp) => {
        const logs = allLogs.filter((l) => l.userId === emp.id)
        const present = logs.filter((l) => l.status === "PRESENT" || l.status === "LATE").length
        const late = logs.filter((l) => l.isLate).length
        const leave = logs.filter((l) => l.status === "LEAVE").length
        const totalHours = (logs.reduce((s, l) => s + l.netWorkMinutes, 0) / 60).toFixed(1)
        const totalDistance = (logs.reduce((s, l) => s + (l.totalDistanceKm || 0), 0)).toFixed(2)
        const rate = totalWorkingDays > 0 ? `${Math.round((present / totalWorkingDays) * 100)}%` : "0%"

        csvContent += `"${emp.employeeId}","${emp.name}","${emp.department}",${present},${Math.max(0, totalWorkingDays - present)},${late},${leave},${totalHours}h,${totalDistance} km,${rate}\n`
      })
    } else {
      const emp = await prisma.user.findUnique({ where: { id: employeeId } })
      filename = `attendance-${emp?.name ? emp.name.replace(/\s+/g, "_") : "employee"}-${monthName}-${year}.csv`

      const logs = await prisma.attendanceLog.findMany({
        where: {
          userId: employeeId,
          date: { gte: monthStart, lte: monthEnd }
        },
        orderBy: { date: "asc" }
      })

      csvContent = "Date,Employee ID,Name,Clock-In Time,From Location (Address/City),Clock-Out Time,To Location (Address/City),Distance Traveled (km),Work Hours,Break Minutes,Status,Is Late\n"
      logs.forEach((log) => {
        const dateStr = new Date(log.date).toLocaleDateString("en-IN")
        const loginStr = log.loginTime ? new Date(log.loginTime).toLocaleTimeString("en-IN") : "-"
        const logoutStr = log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString("en-IN") : "-"
        const fromLoc = log.loginAddress || log.loginCity || "N/A"
        const toLoc = log.logoutAddress || log.logoutCity || "N/A"
        const dist = log.totalDistanceKm ? `${log.totalDistanceKm.toFixed(2)} km` : "0 km"
        const hours = (log.netWorkMinutes / 60).toFixed(1)

        csvContent += `"${dateStr}","${emp?.employeeId || ""}","${emp?.name || ""}","${loginStr}","${fromLoc}","${logoutStr}","${toLoc}","${dist}",${hours}h,${log.totalBreakMinutes},${log.status},${log.isLate}\n`
      })
    }
  } else if (reportType === "work-hours") {
    if (employeeId === "all") {
      filename = `work-hours-${monthName}-${year}.csv`
      csvContent = "Employee ID,Name,Department,Total Work Hours,Avg Hours/Day,Overtime Hours,Total Distance (km),Late Arrivals,Avg Login,Avg Logout\n"

      const employees = await prisma.user.findMany({
        where: { role: "EMPLOYEE", isActive: true },
        select: { id: true, name: true, employeeId: true, department: true }
      })
      const logs = await prisma.attendanceLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      })



      employees.forEach((emp) => {
        const empLogs = logs.filter((l) => l.userId === emp.id)
        const presentLogs = empLogs.filter((l) => l.loginTime !== null)
        const totalMinutes = empLogs.reduce((s, l) => s + l.netWorkMinutes, 0)
        const totalHours = (totalMinutes / 60).toFixed(1)
        const overtimeHours = (empLogs.reduce((s, l) => s + l.overtimeMinutes, 0) / 60).toFixed(1)
        const totalDistance = empLogs.reduce((s, l) => s + (l.totalDistanceKm || 0), 0).toFixed(2)
        const lateCount = empLogs.filter((l) => l.isLate).length
        const avgHours = presentLogs.length > 0 ? (parseFloat(totalHours) / presentLogs.length).toFixed(1) : "0"

        const loginTimes = presentLogs.filter((l) => l.loginTime).map((l) => new Date(l.loginTime!).getHours() * 60 + new Date(l.loginTime!).getMinutes())
        const logoutTimes = presentLogs.filter((l) => l.logoutTime).map((l) => new Date(l.logoutTime!).getHours() * 60 + new Date(l.logoutTime!).getMinutes())

        const avgLoginMinutes = loginTimes.length > 0 ? Math.round(loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length) : null
        const avgLogoutMinutes = logoutTimes.length > 0 ? Math.round(logoutTimes.reduce((a, b) => a + b, 0) / logoutTimes.length) : null

        csvContent += `"${emp.employeeId}","${emp.name}","${emp.department}",${totalHours}h,${avgHours}h,${overtimeHours}h,${totalDistance} km,${lateCount},"${minutesToTime(avgLoginMinutes)}","${minutesToTime(avgLogoutMinutes)}"\n`
      })
    } else {
      const emp = await prisma.user.findUnique({ where: { id: employeeId } })
      filename = `work-hours-${emp?.name ? emp.name.replace(/\s+/g, "_") : "employee"}-${monthName}-${year}.csv`

      const logs = await prisma.attendanceLog.findMany({
        where: {
          userId: employeeId,
          date: { gte: monthStart, lte: monthEnd }
        },
        orderBy: { date: "asc" }
      })

      csvContent = "Date,Employee ID,Name,Department,Clock-In Time,From Location (Address/City),Clock-Out Time,To Location (Address/City),Distance Traveled (km),Net Work Hours,Overtime Hours,Status\n"
      logs.forEach((log) => {
        const dateStr = new Date(log.date).toLocaleDateString("en-IN")
        const loginStr = log.loginTime ? new Date(log.loginTime).toLocaleTimeString("en-IN") : "-"
        const logoutStr = log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString("en-IN") : "-"
        const fromLoc = log.loginAddress || log.loginCity || "N/A"
        const toLoc = log.logoutAddress || log.logoutCity || "N/A"
        const dist = log.totalDistanceKm ? `${log.totalDistanceKm.toFixed(2)} km` : "0 km"
        const hours = (log.netWorkMinutes / 60).toFixed(1)
        const overtime = (log.overtimeMinutes / 60).toFixed(1)

        csvContent += `"${dateStr}","${emp?.employeeId || ""}","${emp?.name || ""}","${emp?.department || ""}","${loginStr}","${fromLoc}","${logoutStr}","${toLoc}","${dist}",${hours}h,${overtime}h,${log.status}\n`
      })
    }
  } else if (reportType === "performance") {
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
      where: {
        role: "EMPLOYEE",
        isActive: true,
        ...(employeeId !== "all" ? { id: employeeId } : {})
      },
      select: { id: true, name: true, employeeId: true, department: true }
    })

    const [logs, tasks] = await Promise.all([
      prisma.attendanceLog.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          ...(employeeId !== "all" ? { userId: employeeId } : {})
        }
      }),
      prisma.task.findMany({
        where: { assignedToId: { in: employees.map((e) => e.id) } }
      })
    ])

    filename = employeeId === "all" ? `performance-${monthName}-${year}.csv` : `performance-${employees[0]?.name?.replace(/\s+/g, "_") || "employee"}-${monthName}-${year}.csv`

    csvContent = "Employee ID,Name,Department,Attendance Rate,Tasks Assigned,Tasks Completed,Task Completion Rate,Total Distance (km)\n"

    employees.forEach((emp) => {
      const empLogs = logs.filter((l) => l.userId === emp.id)
      const empTasks = tasks.filter((t) => t.assignedToId === emp.id)
      const present = empLogs.filter((l) => l.status === "PRESENT" || l.status === "LATE").length
      const attendancePct = totalWorkingDays > 0 ? `${Math.round((present / totalWorkingDays) * 100)}%` : "0%"
      const completed = empTasks.filter((t) => t.status === "COMPLETED").length
      const completionRate = empTasks.length > 0 ? `${Math.round((completed / empTasks.length) * 100)}%` : "0%"
      const totalDistance = empLogs.reduce((s, l) => s + (l.totalDistanceKm || 0), 0).toFixed(2)

      csvContent += `"${emp.employeeId}","${emp.name}","${emp.department}",${attendancePct},${empTasks.length},${completed},${completionRate},${totalDistance} km\n`
    })
  }

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
