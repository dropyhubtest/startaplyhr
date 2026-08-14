import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, department: true, jobTitle: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedByAdmin: {
          select: { id: true, name: true, email: true },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Employees can only view jobs assigned to them
    if (session.user.role === "EMPLOYEE" && job.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error("[JOB_GET_SINGLE_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      workType,
      jobType,
      salaryRange,
      priority,
      status,
      deadline,
      positionsToFill,
      positionsFilled,
      jdDocumentUrl,
      jdDocumentName,
    } = body

    const existing = await prisma.job.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(clientName !== undefined && { clientName }),
        ...(description && { description }),
        ...(skills !== undefined && { skills }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        ...(location !== undefined && { location }),
        ...(workType && { workType }),
        ...(jobType && { jobType }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(positionsToFill !== undefined && { positionsToFill: Number(positionsToFill) }),
        ...(positionsFilled !== undefined && { positionsFilled: Number(positionsFilled) }),
        ...(jdDocumentUrl !== undefined && { jdDocumentUrl }),
        ...(jdDocumentName !== undefined && { jdDocumentName }),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Log update
    await prisma.jobUpdate.create({
      data: {
        jobId: params.id,
        userId: session.user.id,
        updateType: "NOTE",
        title: "Job Details Updated",
        description: `Admin updated job details for ${updatedJob.title}`,
      },
    })

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error("[JOB_UPDATE_ERROR]", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  try {
    const job = await prisma.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Delete job (cascades updates)
    await prisma.job.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[JOB_DELETE_ERROR]", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}
