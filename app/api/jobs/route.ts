import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Priority order mapping for sorting
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const assignedTo = searchParams.get("assignedTo")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const skip = (page - 1) * limit

  try {
    const where: any = {}

    // Employees can only see jobs assigned to them
    if (session.user.role === "EMPLOYEE") {
      where.assignedToId = session.user.id
    } else if (assignedTo) {
      if (assignedTo === "unassigned") {
        where.assignedToId = null
      } else if (assignedTo !== "all") {
        where.assignedToId = assignedTo
      }
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (priority && priority !== "all") {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { jobId: { contains: search, mode: "insensitive" } },
        { skills: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: "desc" }
        ],
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, department: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { updates: true },
          },
        },
      }),
    ])

    // Sort manually by priority rank if requested or default
    const sortedJobs = [...jobs].sort((a, b) => {
      const prioA = PRIORITY_ORDER[a.priority] || 0
      const prioB = PRIORITY_ORDER[b.priority] || 0
      if (prioA !== prioB) return prioB - prioA
      return 0
    })

    return NextResponse.json({
      jobs: sortedJobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[JOBS_GET_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      title,
      clientName,
      description,
      skills,
      experienceLevel,
      location,
      workType = "ONSITE",
      jobType = "FULL_TIME",
      salaryRange,
      priority = "MEDIUM",
      deadline,
      positionsToFill = 1,
      jdDocumentUrl,
      jdDocumentName,
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    // Generate auto Job ID: JOB001, JOB002...
    const count = await prisma.job.count()
    const jobId = `JOB${String(count + 1).padStart(3, "0")}`

    const job = await prisma.job.create({
      data: {
        jobId,
        title,
        clientName: clientName || null,
        description,
        skills: skills || null,
        experienceLevel: experienceLevel || null,
        location: location || null,
        workType,
        jobType,
        salaryRange: salaryRange || null,
        priority,
        status: "OPEN",
        deadline: deadline ? new Date(deadline) : null,
        positionsToFill: Number(positionsToFill) || 1,
        positionsFilled: 0,
        jdDocumentUrl: jdDocumentUrl || null,
        jdDocumentName: jdDocumentName || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Log creation update
    await prisma.jobUpdate.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        updateType: "CREATION",
        title: `Job Description Created (${job.jobId})`,
        description: `Created job posting for ${job.title}`,
      },
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    console.error("[JOB_CREATE_ERROR]", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}
