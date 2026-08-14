import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { attendanceLogId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const attendanceLog = await prisma.attendanceLog.findUnique({
      where: { id: params.attendanceLogId },
      include: {
        user: {
          select: { name: true, email: true, employeeId: true, department: true },
        },
        locationPings: {
          orderBy: { timestamp: "asc" },
        },
      },
    })

    if (!attendanceLog) {
      return NextResponse.json(
        { error: "Attendance log not found" },
        { status: 404 }
      )
    }

    // Employees can only see their own location data
    if (
      session.user.role === "EMPLOYEE" &&
      attendanceLog.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      attendanceLog: {
        id: attendanceLog.id,
        date: attendanceLog.date,
        loginTime: attendanceLog.loginTime,
        logoutTime: attendanceLog.logoutTime,
        status: attendanceLog.status,
        totalWorkMinutes: attendanceLog.totalWorkMinutes,
        netWorkMinutes: attendanceLog.netWorkMinutes,
        loginLatitude: attendanceLog.loginLatitude,
        loginLongitude: attendanceLog.loginLongitude,
        loginAddress: attendanceLog.loginAddress,
        loginCity: attendanceLog.loginCity,
        logoutLatitude: attendanceLog.logoutLatitude,
        logoutLongitude: attendanceLog.logoutLongitude,
        logoutAddress: attendanceLog.logoutAddress,
        logoutCity: attendanceLog.logoutCity,
        totalDistanceKm: attendanceLog.totalDistanceKm,
      },
      employee: attendanceLog.user,
      locationPings: attendanceLog.locationPings,
    })
  } catch (error) {
    console.error("[LOCATION_DATA] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500 }
    )
  }
}
