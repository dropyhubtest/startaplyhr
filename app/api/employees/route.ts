import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  let department = searchParams.get("department") || ""
  if (department === "all") department = ""
  const status = searchParams.get("status") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  const where: any = {
    role: "EMPLOYEE",
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
        { jobTitle: { contains: search } },
      ]
    }),
    ...(department && { department }),
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
  }

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        jobTitle: true,
        profilePhoto: true,
        isActive: true,
        dateOfJoining: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where })
  ])

  return NextResponse.json({
    employees,
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, phone, jobTitle, dateOfJoining, salary, password } = body

  if (!name || !email || !jobTitle || !dateOfJoining || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 })
  }

  const lastEmployee = await prisma.user.findFirst({
    where: { role: "EMPLOYEE" },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true }
  })
  
  let nextNum = 1
  if (lastEmployee?.employeeId) {
    const num = parseInt(lastEmployee.employeeId.replace("EMP", ""))
    nextNum = isNaN(num) ? 1 : num + 1
  }
  const employeeId = `EMP${String(nextNum).padStart(3, "0")}`

  const hashedPassword = await bcrypt.hash(password, 12)

  const employee = await prisma.user.create({
    data: {
      employeeId,
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      department: "General",
      jobTitle,
      dateOfJoining: new Date(dateOfJoining),
      salary: salary ? parseFloat(salary) : null,
      role: "EMPLOYEE",
      isActive: true,
      isFirstLogin: true,
    },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      department: true,
      jobTitle: true,
      isActive: true,
      dateOfJoining: true,
    }
  })

  await prisma.leaveBalance.create({
    data: {
      userId: employee.id,
      year: new Date().getFullYear(),
      sickLeave: 10,
      casualLeave: 12,
      paidLeave: 15,
      wfhLeave: 24,
      usedSick: 0,
      usedCasual: 0,
      usedPaid: 0,
      usedWFH: 0,
    }
  })

  await prisma.notification.create({
    data: {
      userId: employee.id,
      title: "Welcome to Startaply HR!",
      message: `Your account has been created. Employee ID: ${employeeId}`,
      type: "GENERAL",
      isRead: false,
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "EMPLOYEE_CREATED",
      details: `Created employee ${name} (${employeeId})`,
    }
  })

  return NextResponse.json({
    employee,
    credentials: {
      employeeId,
      email,
    }
  }, { status: 201 })
}
