import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let settings = await prisma.companySettings.findFirst()

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        companyName: "Startaply",
        workStartTime: "09:00",
        workEndTime: "18:00",
        lateThresholdMinutes: 30,
        maxBreakMinutes: 60,
        overtimeAfterMinutes: 540,
        defaultSickLeave: 10,
        defaultCasualLeave: 12,
        defaultPaidLeave: 15,
        defaultWFHLeave: 24,
      }
    })
  }

  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    companyName,
    workStartTime,
    workEndTime,
    lateThresholdMinutes,
    maxBreakMinutes,
    overtimeAfterMinutes,
    defaultSickLeave,
    defaultCasualLeave,
    defaultPaidLeave,
    defaultWFHLeave,
    enableLocationTracking,
    requireLocationForClockIn,
    trackLocationDuringWork,
    locationPingIntervalMinutes,
  } = body

  let settings = await prisma.companySettings.findFirst()

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        companyName: companyName || "Startaply",
        workStartTime: workStartTime || "09:00",
        workEndTime: workEndTime || "18:00",
        lateThresholdMinutes: lateThresholdMinutes !== undefined ? parseInt(lateThresholdMinutes) : 30,
        maxBreakMinutes: maxBreakMinutes !== undefined ? parseInt(maxBreakMinutes) : 60,
        overtimeAfterMinutes: overtimeAfterMinutes !== undefined ? parseInt(overtimeAfterMinutes) : 540,
        defaultSickLeave: defaultSickLeave !== undefined ? parseInt(defaultSickLeave) : 10,
        defaultCasualLeave: defaultCasualLeave !== undefined ? parseInt(defaultCasualLeave) : 12,
        defaultPaidLeave: defaultPaidLeave !== undefined ? parseInt(defaultPaidLeave) : 15,
        defaultWFHLeave: defaultWFHLeave !== undefined ? parseInt(defaultWFHLeave) : 24,
        enableLocationTracking: enableLocationTracking ?? false,
        requireLocationForClockIn: requireLocationForClockIn ?? false,
        trackLocationDuringWork: trackLocationDuringWork ?? false,
        locationPingIntervalMinutes: locationPingIntervalMinutes ? parseInt(locationPingIntervalMinutes) : 15,
      }
    })
  } else {
    settings = await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(workStartTime !== undefined && { workStartTime }),
        ...(workEndTime !== undefined && { workEndTime }),
        ...(lateThresholdMinutes !== undefined && { lateThresholdMinutes: parseInt(lateThresholdMinutes) }),
        ...(maxBreakMinutes !== undefined && { maxBreakMinutes: parseInt(maxBreakMinutes) }),
        ...(overtimeAfterMinutes !== undefined && { overtimeAfterMinutes: parseInt(overtimeAfterMinutes) }),
        ...(defaultSickLeave !== undefined && { defaultSickLeave: parseInt(defaultSickLeave) }),
        ...(defaultCasualLeave !== undefined && { defaultCasualLeave: parseInt(defaultCasualLeave) }),
        ...(defaultPaidLeave !== undefined && { defaultPaidLeave: parseInt(defaultPaidLeave) }),
        ...(defaultWFHLeave !== undefined && { defaultWFHLeave: parseInt(defaultWFHLeave) }),
        ...(enableLocationTracking !== undefined && { enableLocationTracking }),
        ...(requireLocationForClockIn !== undefined && { requireLocationForClockIn }),
        ...(trackLocationDuringWork !== undefined && { trackLocationDuringWork }),
        ...(locationPingIntervalMinutes !== undefined && { locationPingIntervalMinutes: parseInt(locationPingIntervalMinutes) }),
      }
    })
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SETTINGS_UPDATED",
      details: "Company settings updated",
    }
  })

  return NextResponse.json({ settings })
}
