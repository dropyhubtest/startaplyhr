import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

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

  // Notify employee (Batman)
  sendNotification(
    leave.userId,
    "Leave Request Declined ❌",
    `Your ${leave.leaveType.toLowerCase()} leave request was declined. Reason: ${adminComment}`,
    "LEAVE_REJECTED"
  ).catch(() => {})

  // Notify admin
  sendNotification(
    session.user.id,
    "Leave Request Declined",
    `You declined ${leave.user.name}'s ${leave.leaveType.toLowerCase()} leave request.`,
    "LEAVE_REJECTED"
  ).catch(() => {})

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_REJECTED",
      details: `Rejected leave for ${leave.user.name}. Reason: ${adminComment}`,
    }
  })

  return NextResponse.json({ leave: updated })
}
