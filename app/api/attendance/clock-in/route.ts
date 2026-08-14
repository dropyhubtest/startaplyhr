import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reverseGeocode } from "@/lib/geocode"
import { sendNotification } from "@/lib/utils"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse optional location data from request body
  let latitude: number | null = null
  let longitude: number | null = null
  let accuracy: number | null = null

  try {
    const body = await request.json()
    latitude = body.latitude ?? null
    longitude = body.longitude ?? null
    accuracy = body.accuracy ?? null
  } catch {
    // No body or invalid JSON — location is optional
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.attendanceLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: todayStart, lte: todayEnd }
    }
  })

  if (existing) {
    return NextResponse.json({ error: "Already clocked in today" }, { status: 400 })
  }

  const onLeave = await prisma.leave.findFirst({
    where: {
      userId: session.user.id,
      status: "APPROVED",
      startDate: { lte: todayEnd },
      endDate: { gte: todayStart }
    }
  })

  if (onLeave) {
    return NextResponse.json({ error: "You are on approved leave today" }, { status: 400 })
  }

  const settings = await prisma.companySettings.findFirst()
  const workStartTime = settings?.workStartTime || "09:00"
  const lateThreshold = settings?.lateThresholdMinutes || 30

  const [startHour, startMin] = workStartTime.split(":").map(Number)
  const workStartDate = new Date(now)
  workStartDate.setHours(startHour, startMin, 0, 0)
  
  const lateDeadline = new Date(workStartDate)
  lateDeadline.setMinutes(lateDeadline.getMinutes() + lateThreshold)
  
  const isLate = now > lateDeadline
  const status = isLate ? "LATE" : "PRESENT"

  // Reverse geocode location (non-blocking — don't fail clock-in if this fails)
  let loginAddress: string | null = null
  let loginCity: string | null = null

  if (latitude != null && longitude != null) {
    try {
      const geo = await reverseGeocode(latitude, longitude)
      if (geo) {
        loginAddress = geo.address
        loginCity = geo.city
      }
    } catch (e) {
      console.log("[CLOCK_IN] Geocoding failed, continuing without address")
    }
  }

  const attendanceLog = await prisma.attendanceLog.create({
    data: {
      userId: session.user.id,
      date: todayStart,
      loginTime: now,
      status,
      isLate,
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      netWorkMinutes: 0,
      overtimeMinutes: 0,
      loginLatitude: latitude,
      loginLongitude: longitude,
      loginAddress,
      loginCity,
    }
  })

  // Create initial location ping if location was provided
  if (latitude != null && longitude != null) {
    try {
      await prisma.locationPing.create({
        data: {
          attendanceLogId: attendanceLog.id,
          userId: session.user.id,
          latitude,
          longitude,
          accuracy,
          address: loginAddress,
        }
      })
    } catch (e) {
      console.log("[CLOCK_IN] Failed to create initial location ping")
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CLOCK_IN",
      details: `Clocked in at ${now.toLocaleTimeString()}${isLate ? " (LATE)" : ""}${loginCity ? ` from ${loginCity}` : ""}`,
    }
  })

  // Send real-time activity notification to employee
  sendNotification(
    session.user.id,
    "Clock In Recorded ⏰",
    `You clocked in at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}${isLate ? " (LATE)" : ""}${loginCity ? ` from ${loginCity}` : ""}`,
    "ATTENDANCE_ALERT"
  ).catch(() => {})

  // Send real-time activity notification to all admins
  prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true }
  }).then((admins) => {
    admins.forEach((admin) => {
      sendNotification(
        admin.id,
        "Employee Clocked In ⏰",
        `${session.user.name} clocked in at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}${isLate ? " (LATE)" : ""}${loginCity ? ` from ${loginCity}` : ""}`,
        "ATTENDANCE_ALERT"
      ).catch(() => {})
    })
  }).catch(() => {})

  try {
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "WORKING",
        loginTime: now.toISOString(),
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  return NextResponse.json({
    success: true,
    attendanceLog,
    isLate,
    locationCity: loginCity,
    message: isLate
      ? `Clocked in (Late by ${Math.round((now.getTime() - lateDeadline.getTime()) / 60000)} minutes)${loginCity ? ` from ${loginCity}` : ""}`
      : `Clocked in successfully${loginCity ? ` from ${loginCity}` : ""}`
  })
}
