import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { loginTime, logoutTime, status, adminNote } = body

  const log = await prisma.attendanceLog.findUnique({
    where: { id: params.id },
    include: { user: true }
  })

  if (!log) {
    return NextResponse.json({ error: "Attendance log not found" }, { status: 404 })
  }

  const parsedLogin = loginTime ? new Date(loginTime) : null
  const parsedLogout = logoutTime ? new Date(logoutTime) : null

  let totalWorkMinutes = 0
  let netWorkMinutes = 0

  if (parsedLogin && parsedLogout) {
    totalWorkMinutes = Math.round((parsedLogout.getTime() - parsedLogin.getTime()) / 60000)
    netWorkMinutes = Math.max(0, totalWorkMinutes - log.totalBreakMinutes)
  } else if (parsedLogin && !parsedLogout) {
    totalWorkMinutes = 0
    netWorkMinutes = 0
  }

  const updatedLog = await prisma.attendanceLog.update({
    where: { id: params.id },
    data: {
      loginTime: parsedLogin,
      logoutTime: parsedLogout,
      status,
      adminNote,
      correctedBy: session.user.id,
      totalWorkMinutes,
      netWorkMinutes,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ATTENDANCE_CORRECTED",
      details: `Corrected attendance for ${log.user.name} on ${log.date.toISOString().split('T')[0]}`,
    }
  })

  return NextResponse.json({ success: true, updatedLog })
}
