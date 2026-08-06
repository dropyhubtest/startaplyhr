import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDateStr = searchParams.get("startDate")
  const endDateStr = searchParams.get("endDate")

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 })
  }

  const startDate = new Date(startDateStr)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(endDateStr)
  endDate.setHours(23, 59, 59, 999)

  try {
    // 1. Get employees
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, employeeId: true, department: true, profilePhoto: true }
    })

    // 2. Get all logs in range
    const logs = await prisma.attendanceLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      }
    })

    // 3. Get all approved leaves in range
    const leaves = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      }
    })

    // 4. Get working day overrides
    const overrides = await prisma.workingDayOverride.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      }
    })

    // 5. Calculate total working days in this specific range
    let totalWorkingDays = 0
    const current = new Date(startDate)
    while (current <= endDate) {
      const day = current.getDay()
      const isWeekend = day === 0 || day === 6
      
      const override = overrides.find(o => {
        const oDate = new Date(o.date)
        return oDate.getFullYear() === current.getFullYear() &&
               oDate.getMonth() === current.getMonth() &&
               oDate.getDate() === current.getDate()
      })

      if (override) {
        if (override.isWorkingDay) totalWorkingDays++
      } else if (!isWeekend) {
        totalWorkingDays++
      }
      
      current.setDate(current.getDate() + 1)
    }

    // 6. Aggregate data per employee
    const summary = employees.map(emp => {
      const empLogs = logs.filter(l => l.userId === emp.id)
      const empLeaves = leaves.filter(l => l.userId === emp.id)
      
      const presentDays = empLogs.length
      const lateDays = empLogs.filter(l => l.isLate).length
      
      let leaveDaysInRange = 0
      empLeaves.forEach(leave => {
        const ls = new Date(Math.max(leave.startDate.getTime(), startDate.getTime()))
        const le = new Date(Math.min(leave.endDate.getTime(), endDate.getTime()))
        let curr = new Date(ls)
        while (curr <= le) {
          const day = curr.getDay()
          const isWeekend = day === 0 || day === 6
          const override = overrides.find(o => {
            const oDate = new Date(o.date)
            return oDate.getFullYear() === curr.getFullYear() && oDate.getMonth() === curr.getMonth() && oDate.getDate() === curr.getDate()
          })
          
          if (override ? override.isWorkingDay : !isWeekend) {
            leaveDaysInRange++
          }
          curr.setDate(curr.getDate() + 1)
        }
      })

      const absentDays = Math.max(0, totalWorkingDays - presentDays - leaveDaysInRange)
      
      const totalNetMinutes = empLogs.reduce((acc, log) => acc + (log.netWorkMinutes || 0), 0)
      const avgMinutes = presentDays > 0 ? Math.round(totalNetMinutes / presentDays) : 0

      return {
        ...emp,
        stats: {
          present: presentDays,
          late: lateDays,
          leave: leaveDaysInRange,
          absent: absentDays,
          avgMinutes
        },
        logs: empLogs.map(l => ({
          date: l.date,
          loginTime: l.loginTime,
          logoutTime: l.logoutTime,
          isLate: l.isLate,
          netWorkMinutes: l.netWorkMinutes
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
    })

    return NextResponse.json({ summary, totalWorkingDays })

  } catch (error) {
    console.error("History API Error:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
