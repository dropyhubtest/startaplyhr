import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { confirmText } = body

  if (confirmText !== "RESET") {
    return NextResponse.json({ error: "Please type RESET to confirm" }, { status: 400 })
  }

  const settings = await prisma.companySettings.findFirst()

  const updated = await prisma.leaveBalance.updateMany({
    data: {
      usedSick: 0,
      usedCasual: 0,
      usedPaid: 0,
      usedWFH: 0,
      year: new Date().getFullYear(),
      sickLeave: settings?.defaultSickLeave || 10,
      casualLeave: settings?.defaultCasualLeave || 12,
      paidLeave: settings?.defaultPaidLeave || 15,
      wfhLeave: settings?.defaultWFHLeave || 24,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_BALANCES_RESET",
      details: `Reset leave balances for all employees. Count: ${updated.count}`,
    }
  })

  return NextResponse.json({
    success: true,
    message: `Leave balances reset for ${updated.count} employees`,
    count: updated.count,
  })
}
