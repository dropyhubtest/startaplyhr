import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === "EMPLOYEE" && session.user.id !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  let logs = await prisma.attendanceLog.findMany({
    where: {
      userId: params.id,
      date: { gte: monthStart, lte: monthEnd }
    },
    include: {
      breaks: true
    },
    orderBy: { date: "asc" }
  })

  // Fetch approved leaves overlapping with this month
  const approvedLeaves = await prisma.leave.findMany({
    where: {
      userId: params.id,
      status: "APPROVED",
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart }
    }
  })

  // Inject virtual logs for leave days
  approvedLeaves.forEach(leave => {
    let current = new Date(leave.startDate)
    const end = new Date(leave.endDate)
    
    while (current <= end) {
      if (current >= monthStart && current <= monthEnd) {
        // Only inject if there isn't already a real log for this day
        const existingLog = logs.find(l => new Date(l.date).toDateString() === current.toDateString())
        if (!existingLog) {
          logs.push({
            id: `leave-${leave.id}-${current.toISOString()}`,
            userId: params.id,
            date: new Date(current),
            loginTime: null,
            logoutTime: null,
            status: "LEAVE",
            netWorkMinutes: 0,
            totalWorkMinutes: 0,
            totalBreakMinutes: 0,
            overtimeMinutes: 0,
            isLate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            breaks: []
          } as any)
        }
      }
      current.setDate(current.getDate() + 1)
    }
  })

  // Fetch overrides for the month
  const overrides = await prisma.workingDayOverride.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd }
    }
  })

  // Sort logs again in case leaves were added out of order
  logs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const summary = {
    present: logs.filter(l => l.status === "PRESENT" || l.status === "LATE").length,
    absent: logs.filter(l => l.status === "ABSENT").length,
    late: logs.filter(l => l.status === "LATE").length,
    leave: logs.filter(l => l.status === "LEAVE").length,
    halfDay: logs.filter(l => l.status === "HALFDAY").length,
    totalMinutes: logs.reduce((sum, l) => sum + l.netWorkMinutes, 0),
    avgMinutesPerDay: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.netWorkMinutes, 0) / logs.length) : 0,
  }

  return NextResponse.json({ logs, summary, month, year, overrides })
}
