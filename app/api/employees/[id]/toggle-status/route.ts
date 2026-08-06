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

  const current = await prisma.user.findUnique({
    where: { id: params.id },
    select: { isActive: true, name: true, employeeId: true }
  })

  if (!current) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 })
  }

  const employee = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: !current.isActive }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: current.isActive ? "EMPLOYEE_DEACTIVATED" : "EMPLOYEE_ACTIVATED",
      details: `${current.isActive ? "Deactivated" : "Activated"} employee ${current.name}`,
    }
  })

  return NextResponse.json({ success: true, isActive: employee.isActive })
}
