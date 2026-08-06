import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// DELETE /api/leaves/[id]
// Employee only - Cancel own pending leave

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const leave = await prisma.leave.findUnique({
    where: { id: params.id }
  })

  if (!leave) {
    return NextResponse.json(
      { error: "Leave not found" }, { status: 404 }
    )
  }

  if (leave.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden" }, { status: 403 }
    )
  }

  if (leave.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending leaves can be cancelled" },
      { status: 400 }
    )
  }

  await prisma.leave.update({
    where: { id: params.id },
    data: { status: "CANCELLED" }
  })

  return NextResponse.json({ 
    success: true, 
    message: "Leave cancelled successfully" 
  })
}
