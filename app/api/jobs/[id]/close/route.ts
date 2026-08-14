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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (session.user.role === "EMPLOYEE" && job.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Only assigned recruiter or admin can close job" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason } = body

    const oldStatus = job.status
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: "CLOSED",
        closedDate: new Date(),
      },
    })

    // Create JobUpdate entry
    await prisma.jobUpdate.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        updateType: "STATUS_CHANGE",
        title: "Job Closed",
        description: reason ? `Reason: ${reason}` : "Job closed by user",
        oldStatus,
        newStatus: "CLOSED",
      },
    })

    // Notify counterpart
    if (session.user.role === "EMPLOYEE") {
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      })
      for (const admin of adminUsers) {
        await sendNotification(
          admin.id,
          `🎉 ${session.user.name} closed ${job.title}`,
          `Job ${job.jobId} closed by recruiter${reason ? ": " + reason : ""}`,
          "GENERAL"
        )
      }
    } else if (job.assignedToId) {
      await sendNotification(
        job.assignedToId,
        `Job ${job.title} closed by Admin`,
        `Job ${job.jobId} has been marked as closed${reason ? ": " + reason : ""}`,
        "GENERAL"
      )
    }

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error("[JOB_CLOSE_ERROR]", error)
    return NextResponse.json({ error: "Failed to close job" }, { status: 500 })
  }
}
