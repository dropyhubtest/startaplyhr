import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === "EMPLOYEE" && session.user.id !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const employee = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      jobTitle: true,
      profilePhoto: true,
      salary: true,
      isActive: true,
      isFirstLogin: true,
      dateOfJoining: true,
      role: true,
      createdAt: true,
      // Personal info
      dateOfBirth: true,
      gender: true,
      maritalStatus: true,
      nationality: true,
      bloodGroup: true,
      personalEmail: true,
      alternatePhone: true,
      languagesKnown: true,
      // Relations
      address: true,
      emergencyContact: true,
      assetsAssigned: {
        orderBy: { createdAt: "desc" },
      },
    }
  })

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const attendanceLogs = await prisma.attendanceLog.findMany({
    where: {
      userId: params.id,
      date: { gte: monthStart, lte: monthEnd }
    }
  })

  const attendanceSummary = {
    present: attendanceLogs.filter(l => l.status === "PRESENT" || l.status === "LATE").length,
    absent: attendanceLogs.filter(l => l.status === "ABSENT").length,
    late: attendanceLogs.filter(l => l.status === "LATE").length,
    leave: attendanceLogs.filter(l => l.status === "LEAVE").length,
    totalHours: Math.round(attendanceLogs.reduce((sum, l) => sum + l.netWorkMinutes, 0) / 60),
  }

  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: { userId: params.id }
  })

  const activeTasks = await prisma.task.count({
    where: {
      assignedToId: params.id,
      status: { not: "COMPLETED" }
    }
  })

  return NextResponse.json({
    employee,
    attendanceSummary,
    leaveBalance,
    activeTasks,
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, phone, department, jobTitle, salary, isActive } = body

  const employee = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(department && { department }),
      ...(jobTitle && { jobTitle }),
      ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      department: true,
      jobTitle: true,
      isActive: true,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "EMPLOYEE_UPDATED",
      details: `Updated employee ${employee.name} (${employee.employeeId})`,
    }
  })

  return NextResponse.json({ employee })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // True delete: remove employee and all related data in a transaction
    // (Since we don't have onDelete: Cascade in schema for all relations)
    await prisma.$transaction([
      prisma.breakLog.deleteMany({ where: { userId: params.id } }),
      prisma.attendanceLog.deleteMany({ where: { userId: params.id } }),
      prisma.leaveBalance.deleteMany({ where: { userId: params.id } }),
      prisma.leave.deleteMany({ where: { userId: params.id } }),
      prisma.taskComment.deleteMany({ where: { userId: params.id } }),
      prisma.task.deleteMany({ where: { assignedToId: params.id } }),
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } })
    ])

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_DELETED",
        details: `Hard deleted employee with ID ${params.id}`,
      }
    })

    return NextResponse.json({ success: true, message: "Employee deleted successfully" })
  } catch (error) {
    console.error("Delete Employee Error:", error)
    return NextResponse.json({ error: "Failed to delete employee. They may have active dependencies." }, { status: 500 })
  }
}
