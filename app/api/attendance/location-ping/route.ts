import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { latitude, longitude, accuracy } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    // Find today's active attendance log
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const attendanceLog = await prisma.attendanceLog.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: todayStart },
        loginTime: { not: null },
        logoutTime: null,
      },
    })

    if (!attendanceLog) {
      return NextResponse.json(
        { error: "No active work session found" },
        { status: 400 }
      )
    }

    // Rate limit: max 1 ping per minute
    const lastPing = await prisma.locationPing.findFirst({
      where: {
        userId: session.user.id,
        attendanceLogId: attendanceLog.id,
      },
      orderBy: { timestamp: "desc" },
    })

    if (lastPing) {
      const timeSinceLastPing =
        (now.getTime() - new Date(lastPing.timestamp).getTime()) / 1000
      if (timeSinceLastPing < 60) {
        return NextResponse.json(
          { error: "Too many pings. Wait at least 1 minute." },
          { status: 429 }
        )
      }
    }

    const ping = await prisma.locationPing.create({
      data: {
        attendanceLogId: attendanceLog.id,
        userId: session.user.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
      },
    })

    return NextResponse.json({ success: true, ping })
  } catch (error) {
    console.error("[LOCATION_PING] Error:", error)
    return NextResponse.json(
      { error: "Failed to record location ping" },
      { status: 500 }
    )
  }
}
