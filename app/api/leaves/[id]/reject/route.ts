import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// PUT /api/leaves/[id]/reject
// Admin only - requires reason

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

  const body = await request.json()
  const { adminComment } = body

  if (!adminComment || adminComment.trim().length < 5) {
    return NextResponse.json(
      { error: "Please provide a reason for rejection" },
      { status: 400 }
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
      { error: "Only pending leaves can be rejected" },
      { status: 400 }
    )
  }

  const updated = await prisma.leave.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      adminComment,
      approvedById: session.user.id,
    }
  })

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: leave.userId,
      title: "Leave Rejected ❌",
      message: `Your ${leave.leaveType.toLowerCase()} leave request was rejected. Reason: ${adminComment}`,
      type: "LEAVE_REJECTED",
      isRead: false,
    }
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_REJECTED",
      details: `Rejected leave for ${leave.user.name}. Reason: ${adminComment}`,
    }
  })

  // Pusher to employee
  try {
    const { pusher } = await import("@/lib/pusher")
    await pusher.trigger(
      `employee-${leave.userId}`,
      "new-notification",
      {
        title: "Leave Rejected ❌",
        message: `Your leave request was rejected: ${adminComment}`,
        type: "LEAVE_REJECTED",
      }
    )
  } catch (e) {}

  return NextResponse.json({ leave: updated })
}
