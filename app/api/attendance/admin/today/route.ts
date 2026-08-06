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
  const dateParam = searchParams.get("date")
  const now = dateParam ? new Date(dateParam) : new Date()
  
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { 
      id: true, name: true, department: true, 
      employeeId: true, profilePhoto: true 
    }
  })

  const logs = await prisma.attendanceLog.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    include: { breaks: true }
  })

  const onLeave = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: todayEnd },
      endDate: { gte: todayStart }
    },
    select: { userId: true }
  })
  const onLeaveIds = new Set(onLeave.map(l => l.userId))

  const result = employees.map(emp => {
    const log = logs.find(l => l.userId === emp.id)
    const openBreak = log?.breaks.find(b => !b.breakEnd)
    
    let status = "ABSENT"
    if (onLeaveIds.has(emp.id)) status = "ON_LEAVE"
    else if (log) {
      if (log.logoutTime) status = "COMPLETED"
      else if (openBreak) status = "ON_BREAK"
      else status = log.isLate ? "LATE" : "WORKING"
    }

    return {
      ...emp,
      log: log || null,
      status,
      loginTime: log?.loginTime || null,
      logoutTime: log?.logoutTime || null,
      totalBreakMinutes: log?.totalBreakMinutes || 0,
      netWorkMinutes: log?.netWorkMinutes || 0,
      isLate: log?.isLate || false,
    }
  })

  const summary = {
    present: result.filter(
      r => r.status === "WORKING" || r.status === "LATE" || r.status === "COMPLETED"
    ).length,
    onBreak: result.filter(r => r.status === "ON_BREAK").length,
    absent: result.filter(r => r.status === "ABSENT").length,
    onLeave: result.filter(r => r.status === "ON_LEAVE").length,
    late: result.filter(r => r.status === "LATE").length,
  }

  return NextResponse.json({ employees: result, summary })
}
