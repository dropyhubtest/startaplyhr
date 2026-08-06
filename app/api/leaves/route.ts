import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/leaves
// Query params: 
//   status (PENDING/APPROVED/REJECTED/CANCELLED/all)
//   employeeId (specific employee or "all")
//   page, limit

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || ""
  const employeeId = searchParams.get("employeeId") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  // Build where clause based on role
  let where: any = {}

  if (session.user.role === "EMPLOYEE") {
    // Employees can only see their own leaves
    where.userId = session.user.id
  } else {
    // Admin can filter by employee
    if (employeeId && employeeId !== "all") {
      where.userId = employeeId
    }
  }

  // Filter by status
  if (status && status !== "all") {
    where.status = status
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            department: true,
            profilePhoto: true,
          }
        },
        approvedBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.leave.count({ where })
  ])

  return NextResponse.json({
    leaves,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  })
}

// POST /api/leaves
// Employee only - Apply for leave

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const body = await request.json()
  const { leaveType, startDate, endDate, reason } = body

  // Validate required fields
  if (!leaveType || !startDate || !endDate || !reason) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    )
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Cannot apply for past dates
  if (start < today) {
    return NextResponse.json(
      { error: "Cannot apply leave for past dates" },
      { status: 400 }
    )
  }

  // End date must be >= start date
  if (end < start) {
    return NextResponse.json(
      { error: "End date must be after start date" },
      { status: 400 }
    )
  }

  // Calculate working days (exclude weekends)
  function countWorkingDays(start: Date, end: Date): number {
    let count = 0
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }
  const totalDays = countWorkingDays(start, end)

  if (totalDays === 0) {
    return NextResponse.json(
      { error: "Selected dates fall on weekends only" },
      { status: 400 }
    )
  }

  // Check for overlapping approved/pending leaves
  const overlap = await prisma.leave.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: end },
      endDate: { gte: start },
    }
  })

  if (overlap) {
    return NextResponse.json(
      { error: "You already have a leave request for these dates" },
      { status: 400 }
    )
  }

  // Check leave balance
  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: session.user.id }
  })

  if (!balance) {
    return NextResponse.json(
      { error: "Leave balance not found" },
      { status: 400 }
    )
  }

  // Check sufficient balance based on leave type
  const balanceMap: Record<string, number> = {
    SICK: balance.sickLeave - balance.usedSick,
    CASUAL: balance.casualLeave - balance.usedCasual,
    PAID: balance.paidLeave - balance.usedPaid,
    WFH: balance.wfhLeave - balance.usedWFH,
    EMERGENCY: 999, // Emergency leaves always allowed
  }

  const available = balanceMap[leaveType] ?? 0
  if (leaveType !== "EMERGENCY" && available < totalDays) {
    return NextResponse.json(
      { 
        error: `Insufficient ${leaveType.toLowerCase()} leave balance. Available: ${available} days, Requested: ${totalDays} days` 
      },
      { status: 400 }
    )
  }

  // Create leave request
  const leave = await prisma.leave.create({
    data: {
      userId: session.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "PENDING",
    },
    include: {
      user: {
        select: { name: true, employeeId: true }
      }
    }
  })

  // Notify admin
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  })

  if (admin) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "New Leave Request",
        message: `${leave.user.name} has applied for ${totalDays} day(s) of ${leaveType.toLowerCase()} leave`,
        type: "GENERAL",
        isRead: false,
      }
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LEAVE_APPLIED",
      details: `Applied for ${leaveType} leave: ${startDate} to ${endDate} (${totalDays} days)`,
    }
  })

  // Pusher notification to admin
  try {
    const { pusher } = await import("@/lib/pusher")
    await pusher.trigger("hr-dashboard", "new-leave-request", {
      employeeName: leave.user.name,
      leaveType,
      totalDays,
    })
  } catch (e) {}

  return NextResponse.json({ leave }, { status: 201 })
}
