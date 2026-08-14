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
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { assignedTo: true },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const previousRecruiter = job.assignedTo
    const oldStatus = job.status
    const newStatus = oldStatus === "IN_PROGRESS" ? "OPEN" : oldStatus

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        assignedToId: null,
        assignedById: null,
        assignedDate: null,
        status: newStatus,
      },
    })

    // Log update
    await prisma.jobUpdate.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        updateType: "UNASSIGNMENT",
        title: previousRecruiter ? `Unassigned from ${previousRecruiter.name}` : "Recruiter unassigned",
        description: `Admin removed recruiter assignment for ${job.title}`,
        oldStatus,
        newStatus,
      },
    })

    // Notify previous recruiter if existed
    if (previousRecruiter) {
      await sendNotification(
        previousRecruiter.id,
        "Job assignment removed",
        `You are no longer assigned to recruit for ${job.title} (${job.jobId})`,
        "GENERAL"
      )
    }

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error("[JOB_UNASSIGN_ERROR]", error)
    return NextResponse.json({ error: "Failed to unassign job" }, { status: 500 })
  }
}
