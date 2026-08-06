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

    const [todo, inProgress, completed, blocked] = await Promise.all([
      prisma.task.count({ where: { status: "TODO" } }),
      prisma.task.count({ where: { status: "INPROGRESS" } }),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.task.count({ where: { status: "BLOCKED" } }),
    ])

    const total = todo + inProgress + completed + blocked
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      todo,
      inProgress,
      completed,
      blocked,
      completionRate
    })
  } catch (error) {
    console.error("Task stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
