import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const attendanceLog = await prisma.attendanceLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: todayStart, lte: todayEnd }
    },
    include: {
      breaks: {
        orderBy: { breakStart: "asc" }
      }
    }
  })

  let currentStatus = "NOT_STARTED"
  if (attendanceLog) {
    if (attendanceLog.logoutTime) {
      currentStatus = "COMPLETED"
    } else {
      const openBreak = attendanceLog.breaks.find(b => !b.breakEnd)
      currentStatus = openBreak ? "ON_BREAK" : "WORKING"
    }
  }

  return NextResponse.json({
    attendanceLog,
    currentStatus,
    serverTime: now.toISOString(),
  })
}
