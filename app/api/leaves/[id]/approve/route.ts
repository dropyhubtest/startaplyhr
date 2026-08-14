import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

// PUT /api/leaves/[id]/approve
// Admin only

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const leave = await prisma.leave.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, id: true } }
    }
  })

  if (!leave) {
    return NextResponse.json(
      { error: "Leave not found" }, { status: 404 }
    )
  }

  if (leave.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending leaves can be approved" },
      { status: 400 }
    )
  }

  // Update leave status
  const updated = await prisma.leave.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      approvedById: session.user.id,
    }
  })

  // Deduct from leave balance
  const balanceUpdateMap: Record<string, any> = {
    SICK: { usedSick: { increment: leave.totalDays } },
    CASUAL: { usedCasual: { increment: leave.totalDays } },
    PAID: { usedPaid: { increment: leave.totalDays } },
    WFH: { usedWFH: { increment: leave.totalDays } },
    EMERGENCY: {},
  }

  const balanceUpdate = balanceUpdateMap[leave.leaveType]
  if (balanceUpdate && Object.keys(balanceUpdate).length > 0) {
    await prisma.leaveBalance.update({
      where: { userId: leave.userId },
      data: balanceUpdate,
    })
  }

  // Notify employee (Batman)
  sendNotification(
    leave.userId,
    "Leave Approved ✅",
    `Your ${leave.leaveType.toLowerCase()} leave request for ${leave.totalDays} day(s) has been approved.`,
    "LEAVE_APPROVED"
  ).catch(() => {})

  // Notify admin
  sendNotification(
    session.user.id,
    "Leave Approved",
    `You approved ${leave.user.name}'s ${leave.leaveType.toLowerCase()} leave request for ${leave.totalDays} day(s).`,
    "LEAVE_APPROVED"
  ).catch(() => {})

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_APPROVED",
      details: `Approved leave for ${leave.user.name}: ${leave.totalDays} days ${leave.leaveType}`,
    }
  })

  return NextResponse.json({ leave: updated })
}
