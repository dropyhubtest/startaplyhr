import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { recruiterId } = body

    if (!recruiterId) {
      return NextResponse.json({ error: "Recruiter ID is required" }, { status: 400 })
    }

    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
    })

    if (!recruiter || recruiter.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Invalid recruiter selected" }, { status: 400 })
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const oldStatus = job.status
    const newStatus = oldStatus === "OPEN" ? "IN_PROGRESS" : oldStatus

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        assignedToId: recruiterId,
        assignedById: session.user.id,
        assignedDate: new Date(),
        status: newStatus,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Create JobUpdate entry
    await prisma.jobUpdate.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        updateType: "ASSIGNMENT",
        title: `Assigned to ${recruiter.name}`,
        description: `Admin assigned job ${job.jobId} (${job.title}) to ${recruiter.name}`,
        oldStatus,
        newStatus,
      },
    })

    // Send notification to recruiter
    await sendNotification(
      recruiterId,
      "New job assigned to you",
      `You have been assigned to recruit for ${job.title} (${job.clientName ? "Client: " + job.clientName : "JOB ID: " + job.jobId})`,
      "TASK_ASSIGNED"
    )

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error("[JOB_ASSIGN_ERROR]", error)
    return NextResponse.json({ error: "Failed to assign job" }, { status: 500 })
  }
}
