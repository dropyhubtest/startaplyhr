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

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })

    // Batch-fetch ALL data for the entire week in 3 parallel queries
    // instead of 14 sequential queries (2 per day × 7 days)
    const [activeEmployeesCount, weekLogs, weekLeaves] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
      prisma.attendanceLog.findMany({
        where: { date: { gte: monday, lte: sunday } },
        select: { status: true, userId: true, date: true },
      }),
      prisma.leave.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: sunday },
          endDate: { gte: monday },
        },
        select: { userId: true, startDate: true, endDate: true },
      }),
    ])

    // Group logs by day (using date string as key)
    const logsByDay = new Map<string, typeof weekLogs>()
    for (const log of weekLogs) {
      const key = new Date(log.date).toDateString()
      const arr = logsByDay.get(key) || []
      arr.push(log)
      logsByDay.set(key, arr)
    }

    // Build results in-memory
    const results = weekDays.map((dayObj) => {
      const dayStart = new Date(dayObj)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayObj)
      dayEnd.setHours(23, 59, 59, 999)

      const dayLabel = dayObj.toLocaleDateString("en-US", { weekday: "short" })
      const dateLabel = dayObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      // Future days
      if (dayStart > now) {
        return {
          day: dayLabel,
          date: dateLabel,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
        }
      }

      const dayKey = dayObj.toDateString()
      const logs = logsByDay.get(dayKey) || []

      const present = logs.filter(
        (l) => l.status === "PRESENT" || l.status === "LATE"
      ).length
      const late = logs.filter((l) => l.status === "LATE").length

      // Filter leaves that overlap with this specific day
      const dayLeaves = weekLeaves.filter(
        (l) =>
          new Date(l.startDate) <= dayEnd && new Date(l.endDate) >= dayStart
      )
      const onLeave = dayLeaves.length

      const accountedIds = new Set([
        ...logs.map((l) => l.userId),
        ...dayLeaves.map((l) => l.userId),
      ])
      const absent = Math.max(0, activeEmployeesCount - accountedIds.size)

      return {
        day: dayLabel,
        date: dateLabel,
        present,
        absent,
        late,
        onLeave,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Weekly attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
