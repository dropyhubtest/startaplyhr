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

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: {
      id: true, name: true, employeeId: true, department: true
    }
  })

  const [allLogs, allTasks] = await Promise.all([
    prisma.attendanceLog.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        user: { role: "EMPLOYEE" }
      }
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { createdAt: { gte: monthStart, lte: monthEnd } },
          { updatedAt: { gte: monthStart, lte: monthEnd } }
        ]
      }
    })
  ])

  const performanceData = employees.map(emp => {
    const empLogs = allLogs.filter(l => l.userId === emp.id)
    const empTasks = allTasks.filter(t => t.assignedToId === emp.id)

    // Attendance score (0-100)
    const present = empLogs.filter(l => l.status === "PRESENT" || l.status === "LATE").length
    const lateCount = empLogs.filter(l => l.isLate).length
    const attendanceScore = totalWorkingDays > 0
      ? Math.round(((present / totalWorkingDays) * 100) - (lateCount * 2))
      : 0

    // Task metrics
    const tasksAssigned = empTasks.length
    const tasksCompleted = empTasks.filter(t => t.status === "COMPLETED").length
    const tasksOverdue = empTasks.filter(t => 
      t.deadline && new Date(t.deadline) < new Date() && t.status !== "COMPLETED"
    ).length

    const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 100

    // On time delivery rate
    const completedWithDeadline = empTasks.filter(t => t.status === "COMPLETED" && t.deadline)
    const onTimeCompleted = completedWithDeadline.filter(t => new Date(t.updatedAt) <= new Date(t.deadline!)).length
    const onTimeRate = completedWithDeadline.length > 0
      ? Math.round((onTimeCompleted / completedWithDeadline.length) * 100)
      : 100

    // Overall score (weighted)
    const overallScore = Math.min(100, Math.max(0, Math.round(
      (attendanceScore * 0.4) + (completionRate * 0.4) + (onTimeRate * 0.2)
    )))

    // Grade
    const grade = 
      overallScore >= 90 ? "A" :
      overallScore >= 75 ? "B" :
      overallScore >= 60 ? "C" : "D"

    return {
      employee: emp,
      attendanceScore: Math.max(0, attendanceScore),
      tasksAssigned,
      tasksCompleted,
      tasksOverdue,
      completionRate,
      onTimeRate,
      overallScore,
      grade,
      present,
      lateCount,
    }
  })

  // Sort by overall score descending
  performanceData.sort((a, b) => b.overallScore - a.overallScore)

  return NextResponse.json({
    month, year,
    performanceData,
    totalWorkingDays,
  })
}
