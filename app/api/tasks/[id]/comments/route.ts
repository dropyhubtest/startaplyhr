import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tasks/[id]/comments
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          profilePhoto: true,
        }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  return NextResponse.json({ comments })
}

// POST /api/tasks/[id]/comments
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const body = await request.json()
  const { comment } = body

  if (!comment || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment cannot be empty" },
      { status: 400 }
    )
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } }
    }
  })

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" }, { status: 404 }
    )
  }

  // Employee can only comment on own tasks
  if (session.user.role === "EMPLOYEE" && 
      task.assignedToId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden" }, { status: 403 }
    )
  }

  const newComment = await prisma.taskComment.create({
    data: {
      taskId: params.id,
      userId: session.user.id,
      comment: comment.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          profilePhoto: true,
        }
      }
    }
  })

  // Cross-notify:
  // Employee comments → notify admin
  // Admin comments → notify employee
  const commenterName = session.user.name || "Someone"
  
  if (session.user.role === "EMPLOYEE") {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "New Task Comment",
          message: `${commenterName} commented on "${task.title}"`,
          type: "GENERAL",
          isRead: false,
        }
      })
    }
  } else {
    await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        title: "New Comment on Your Task",
        message: `Admin commented on "${task.title}": "${comment.slice(0, 50)}..."`,
        type: "GENERAL",
        isRead: false,
      }
    })
  }

  return NextResponse.json({ comment: newComment }, { status: 201 })
}
