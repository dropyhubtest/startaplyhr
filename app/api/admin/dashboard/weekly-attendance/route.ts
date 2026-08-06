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

    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })

    const activeEmployeesCount = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true }
    })

    const results = await Promise.all(weekDays.map(async (dayObj) => {
      const dayStart = new Date(dayObj)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayObj)
      dayEnd.setHours(23, 59, 59, 999)

      // Only count days in past or today up to now
      if (dayStart > now) {
        return {
          day: dayObj.toLocaleDateString("en-US", { weekday: "short" }),
          date: dayObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0
        }
      }

      const logs = await prisma.attendanceLog.findMany({
        where: { date: { gte: dayStart, lte: dayEnd } },
        select: { status: true, userId: true }
      })

      const present = logs.filter(l => l.status === "PRESENT" || l.status === "LATE").length
      const late = logs.filter(l => l.status === "LATE").length
      
      const leaves = await prisma.leave.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart }
        },
        select: { userId: true }
      })
      const onLeave = leaves.length

      const accountedIds = new Set([...logs.map(l => l.userId), ...leaves.map(l => l.userId)])
      const absent = Math.max(0, activeEmployeesCount - accountedIds.size)

      return {
        day: dayObj.toLocaleDateString("en-US", { weekday: "short" }),
        date: dayObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        present,
        absent,
        late,
        onLeave
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error("Weekly attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
