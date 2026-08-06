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

    const [attendanceLogs, breakLogs, leaves] = await Promise.all([
      prisma.attendanceLog.findMany({
        where: { date: { gte: today } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15
      }),
      prisma.breakLog.findMany({
        where: { breakStart: { gte: today } },
        include: { user: { select: { name: true } } },
        orderBy: { breakStart: "desc" },
        take: 15
      }),
      prisma.leave.findMany({
        where: { createdAt: { gte: today } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ])

    const activities: any[] = []

    attendanceLogs.forEach(log => {
      if (log.loginTime) {
        activities.push({
          id: `login-${log.id}`,
          type: "LOGIN",
          description: `${log.user.name} clocked in`,
          time: log.loginTime
        })
      }
      if (log.logoutTime) {
        activities.push({
          id: `logout-${log.id}`,
          type: "LOGOUT",
          description: `${log.user.name} clocked out`,
          time: log.logoutTime
        })
      }
    })

    breakLogs.forEach(log => {
      activities.push({
        id: `bstart-${log.id}`,
        type: "BREAK_START",
        description: `${log.user.name} started a break`,
        time: log.breakStart
      })
      if (log.breakEnd) {
        activities.push({
          id: `bend-${log.id}`,
          type: "BREAK_END",
          description: `${log.user.name} resumed work`,
          time: log.breakEnd
        })
      }
    })

    leaves.forEach(leave => {
      activities.push({
        id: `leave-${leave.id}`,
        type: "LEAVE_REQUEST",
        description: `${leave.user.name} submitted a leave request`,
        time: leave.createdAt
      })
    })

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json({ activities: activities.slice(0, 20) })
  } catch (error) {
    console.error("Activity feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
