import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/leaves/balance
// Returns leave balance for current user
// Admin can query ?userId=xxx for specific employee

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const queryUserId = searchParams.get("userId")

  // Determine which user's balance to fetch
  let targetUserId = session.user.id
  if (queryUserId && session.user.role === "ADMIN") {
    targetUserId = queryUserId
  }

  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: targetUserId },
    include: {
      user: {
        select: { name: true, employeeId: true }
      }
    }
  })

  if (!balance) {
    return NextResponse.json(
      { error: "Leave balance not found" },
      { status: 404 }
    )
  }

  // Calculate remaining days
  const remaining = {
    sick: balance.sickLeave - balance.usedSick,
    casual: balance.casualLeave - balance.usedCasual,
    paid: balance.paidLeave - balance.usedPaid,
    wfh: balance.wfhLeave - balance.usedWFH,
    total: (balance.sickLeave - balance.usedSick) +
           (balance.casualLeave - balance.usedCasual) +
           (balance.paidLeave - balance.usedPaid) +
           (balance.wfhLeave - balance.usedWFH),
  }

  return NextResponse.json({ balance, remaining })
}
