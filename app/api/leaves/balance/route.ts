import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leaves/balance
// Returns leave balance for current user
// Admin can query ?userId=xxx for specific employee

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get("userId")

    let targetUserId = session.user.id
    if (queryUserId && session.user.role === "ADMIN") {
      targetUserId = queryUserId
    }

    let balance = await prisma.leaveBalance.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: { name: true, employeeId: true },
        },
      },
    })

    // If leave balance record doesn't exist yet, auto-create default balance record
    if (!balance) {
      const currentYear = new Date().getFullYear()
      balance = await prisma.leaveBalance.create({
        data: {
          userId: targetUserId,
          year: currentYear,
          sickLeave: 10,
          casualLeave: 12,
          paidLeave: 15,
          wfhLeave: 24,
          usedSick: 0,
          usedCasual: 0,
          usedPaid: 0,
          usedWFH: 0,
        },
        include: {
          user: {
            select: { name: true, employeeId: true },
          },
        },
      })
    }

    const remaining = {
      sick: Math.max(0, balance.sickLeave - balance.usedSick),
      casual: Math.max(0, balance.casualLeave - balance.usedCasual),
      paid: Math.max(0, balance.paidLeave - balance.usedPaid),
      wfh: Math.max(0, balance.wfhLeave - balance.usedWFH),
      total:
        Math.max(0, balance.sickLeave - balance.usedSick) +
        Math.max(0, balance.casualLeave - balance.usedCasual) +
        Math.max(0, balance.paidLeave - balance.usedPaid) +
        Math.max(0, balance.wfhLeave - balance.usedWFH),
    }

    return NextResponse.json({ balance, remaining })
  } catch (error) {
    console.error("[LEAVES_BALANCE_API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave balance" },
      { status: 500 }
    )
  }
}
