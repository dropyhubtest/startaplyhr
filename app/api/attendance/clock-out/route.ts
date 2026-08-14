import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reverseGeocode } from "@/lib/geocode"
import { haversineDistance, calculateRouteDistance } from "@/lib/haversine"
import { sendNotification } from "@/lib/utils"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse optional location data from request body
  let latitude: number | null = null
  let longitude: number | null = null

  try {
    const body = await request.json()
    latitude = body.latitude ?? null
    longitude = body.longitude ?? null
  } catch {
    // No body or invalid JSON — location is optional
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const attendanceLog = await prisma.attendanceLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: todayStart }
    },
    include: { breaks: true, locationPings: { orderBy: { timestamp: "asc" } } }
  })

  if (!attendanceLog) {
    return NextResponse.json({ error: "You have not clocked in today" }, { status: 400 })
  }

  if (attendanceLog.logoutTime) {
    return NextResponse.json({ error: "You have already clocked out today" }, { status: 400 })
  }

  const openBreak = attendanceLog.breaks.find(b => !b.breakEnd)
  let finalBreakMinutes = attendanceLog.totalBreakMinutes
  
  if (openBreak) {
    const breakDuration = Math.round((now.getTime() - new Date(openBreak.breakStart).getTime()) / 60000)
    await prisma.breakLog.update({
      where: { id: openBreak.id },
      data: {
        breakEnd: now,
        breakDurationMinutes: breakDuration,
      }
    })
    finalBreakMinutes += breakDuration
  }

  const loginTime = new Date(attendanceLog.loginTime!)
  const totalWorkMinutes = Math.round((now.getTime() - loginTime.getTime()) / 60000)
  const netWorkMinutes = Math.max(0, totalWorkMinutes - finalBreakMinutes)

  const settings = await prisma.companySettings.findFirst()
  const overtimeThreshold = settings?.overtimeAfterMinutes || 540
  const overtimeMinutes = Math.max(0, netWorkMinutes - overtimeThreshold)

  let finalStatus = attendanceLog.status
  if (netWorkMinutes < 240) {
    finalStatus = "HALFDAY"
  }

  // Reverse geocode logout location
  let logoutAddress: string | null = null
  let logoutCity: string | null = null

  if (latitude != null && longitude != null) {
    try {
      const geo = await reverseGeocode(latitude, longitude)
      if (geo) {
        logoutAddress = geo.address
        logoutCity = geo.city
      }
    } catch (e) {
      console.log("[CLOCK_OUT] Geocoding failed, continuing without address")
    }
  }

  // Calculate total distance
  let totalDistanceKm: number = 0

  if (latitude != null && longitude != null) {
    // Build full route: login → pings → logout
    const routePoints: { latitude: number; longitude: number }[] = []

    if (attendanceLog.loginLatitude != null && attendanceLog.loginLongitude != null) {
      routePoints.push({
        latitude: attendanceLog.loginLatitude,
        longitude: attendanceLog.loginLongitude,
      })
    }

    // Add all location pings in chronological order
    for (const ping of attendanceLog.locationPings) {
      routePoints.push({ latitude: ping.latitude, longitude: ping.longitude })
    }

    // Add logout location
    routePoints.push({ latitude, longitude })

    if (routePoints.length >= 2) {
      totalDistanceKm = Math.round(calculateRouteDistance(routePoints) * 100) / 100
    }

    // Create logout location ping
    try {
      await prisma.locationPing.create({
        data: {
          attendanceLogId: attendanceLog.id,
          userId: session.user.id,
          latitude,
          longitude,
          address: logoutAddress,
        }
      })
    } catch (e) {
      console.log("[CLOCK_OUT] Failed to create logout location ping")
    }
  }

  const updated = await prisma.attendanceLog.update({
    where: { id: attendanceLog.id },
    data: {
      logoutTime: now,
      totalWorkMinutes,
      totalBreakMinutes: finalBreakMinutes,
      netWorkMinutes,
      overtimeMinutes,
      status: finalStatus,
      logoutLatitude: latitude,
      logoutLongitude: longitude,
      logoutAddress,
      logoutCity,
      totalDistanceKm,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CLOCK_OUT",
      details: `Clocked out at ${now.toLocaleTimeString()}. Net work: ${Math.floor(netWorkMinutes/60)}h ${netWorkMinutes%60}m${logoutCity ? `. Location: ${logoutCity}` : ""}${totalDistanceKm > 0 ? `. Distance: ${totalDistanceKm}km` : ""}`,
    }
  })

  // Send real-time activity notification to employee
  sendNotification(
    session.user.id,
    "Clock Out Recorded ⏹️",
    `You clocked out. Work time: ${Math.floor(netWorkMinutes / 60)}h ${netWorkMinutes % 60}m${totalDistanceKm > 0 ? `. Distance: ${totalDistanceKm.toFixed(1)} km` : ""}`,
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
        "Employee Clocked Out ⏹️",
        `${session.user.name} clocked out. Work time: ${Math.floor(netWorkMinutes / 60)}h ${netWorkMinutes % 60}m${totalDistanceKm > 0 ? `. Distance: ${totalDistanceKm.toFixed(1)} km` : ""}`,
        "ATTENDANCE_ALERT"
      ).catch(() => {})
    })
  }).catch(() => {})

  try {
    const { pusher } = await import("@/lib/pusher")
    if (pusher) {
      await pusher.trigger("hr-dashboard", "employee-status-changed", {
        userId: session.user.id,
        status: "COMPLETED",
        logoutTime: now.toISOString(),
      })
    }
  } catch (e) {
    console.log("Pusher not configured")
  }

  return NextResponse.json({
    success: true,
    summary: {
      loginTime: attendanceLog.loginTime,
      logoutTime: now,
      totalWorkMinutes,
      totalBreakMinutes: finalBreakMinutes,
      netWorkMinutes,
      overtimeMinutes,
      status: finalStatus,
      hoursWorked: `${Math.floor(netWorkMinutes/60)}h ${netWorkMinutes % 60}m`,
      logoutCity,
      totalDistanceKm,
    }
  })
}
