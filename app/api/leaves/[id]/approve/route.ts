import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: leave.userId,
      title: "Leave Approved ✅",
      message: `Your ${leave.leaveType.toLowerCase()} leave request for ${leave.totalDays} day(s) has been approved`,
      type: "LEAVE_APPROVED",
      isRead: false,
    }
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_APPROVED",
      details: `Approved leave for ${leave.user.name}: ${leave.totalDays} days ${leave.leaveType}`,
    }
  })

  // Pusher to employee
  try {
    const { pusher } = await import("@/lib/pusher")
    await pusher.trigger(
      `employee-${leave.userId}`,
      "new-notification",
      {
        title: "Leave Approved ✅",
        message: `Your ${leave.leaveType.toLowerCase()} leave has been approved`,
        type: "LEAVE_APPROVED",
      }
    )
  } catch (e) {}

  return NextResponse.json({ leave: updated })
}
