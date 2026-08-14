import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

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
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (session.user.role === "EMPLOYEE" && job.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates = await prisma.jobUpdate.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json({ updates })
  } catch (error) {
    console.error("[JOB_UPDATES_GET_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch job updates" }, { status: 500 })
  }
}

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
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Only Admin or Assigned Recruiter can post updates
    if (session.user.role === "EMPLOYEE" && job.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Only assigned recruiter or admin can post updates" }, { status: 403 })
    }

    const body = await request.json()
    const {
      updateType = "PROGRESS_UPDATE",
      title,
      description,
      newStatus,
      positionsFilledUpdate,
    } = body

    if (!title) {
      return NextResponse.json({ error: "Update title is required" }, { status: 400 })
    }

    const oldStatus = job.status
    let finalStatus = newStatus || oldStatus
    let closedDate = job.closedDate

    // Handle positions filled update
    let newPositionsFilled = job.positionsFilled
    if (positionsFilledUpdate !== undefined && positionsFilledUpdate !== null) {
      newPositionsFilled = Math.max(0, Number(positionsFilledUpdate))
      if (newPositionsFilled >= job.positionsToFill && finalStatus !== "CLOSED") {
        finalStatus = "CLOSED"
        closedDate = new Date()
      }
    }

    if (newStatus === "CLOSED" && !closedDate) {
      closedDate = new Date()
    }

    // Create update entry
    const update = await prisma.jobUpdate.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        updateType: finalStatus === "CLOSED" && oldStatus !== "CLOSED" ? "HIRED" : updateType,
        title,
        description: description || null,
        oldStatus: oldStatus !== finalStatus ? oldStatus : null,
        newStatus: oldStatus !== finalStatus ? finalStatus : null,
        positionsFilledUpdate: positionsFilledUpdate !== undefined ? Number(positionsFilledUpdate) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    // Update parent job
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        positionsFilled: newPositionsFilled,
        closedDate,
      },
    })

    // Send cross-notifications asynchronously in background
    if (session.user.role === "EMPLOYEE") {
      prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      }).then((adminUsers) => {
        const isHired = finalStatus === "CLOSED" && oldStatus !== "CLOSED"
        const notifTitle = isHired ? `🎉 ${session.user.name} closed ${job.title}!` : `${session.user.name} updated ${job.title}`
        const notifMessage = isHired
          ? `${session.user.name} filled all ${job.positionsToFill} position(s) for ${job.title}!`
          : `${title}${description ? ": " + description : ""}`

        Promise.all(
          adminUsers.map((admin) => sendNotification(admin.id, notifTitle, notifMessage, "GENERAL"))
        ).catch((err) => console.error("Admin notification error:", err))
      }).catch(() => {})
    } else if (session.user.role === "ADMIN" && job.assignedToId) {
      sendNotification(
        job.assignedToId,
        `Admin update on ${job.title}`,
        `${title}${description ? ": " + description : ""}`,
        "GENERAL"
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, update, job: updatedJob }, { status: 201 })
  } catch (error) {
    console.error("[JOB_UPDATE_POST_ERROR]", error)
    return NextResponse.json({ error: "Failed to post job update" }, { status: 500 })
  }
}
