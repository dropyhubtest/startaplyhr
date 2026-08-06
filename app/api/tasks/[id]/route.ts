import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tasks/[id]
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

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: {
        select: {
          id: true, name: true, 
          employeeId: true, department: true
        }
      },
      assignedBy: {
        select: { id: true, name: true }
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: "asc" }
      },
      _count: { select: { comments: true } }
    }
  })

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" }, { status: 404 }
    )
  }

  // Employee can only view own tasks
  if (session.user.role === "EMPLOYEE" && 
      task.assignedToId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden" }, { status: 403 }
    )
  }

  return NextResponse.json({ task })
}

// PUT /api/tasks/[id]
// Admin: update all fields
// Employee: update status only

export async function PUT(
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
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { name: true } }
    }
  })

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" }, { status: 404 }
    )
  }

  let updateData: any = {}

  if (session.user.role === "ADMIN") {
    // Admin can update everything
    const { title, description, assignedToId, 
            priority, status, deadline } = body
    updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(assignedToId && { assignedToId }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(deadline !== undefined && { 
        deadline: deadline ? new Date(deadline) : null 
      }),
    }
  } else {
    // Employee can only update status
    if (task.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" }, { status: 403 }
      )
    }
    if (body.status) {
      updateData = { status: body.status }
    }
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
    include: {
      assignedTo: {
        select: { id: true, name: true, employeeId: true }
      },
      assignedBy: { select: { name: true } },
      _count: { select: { comments: true } }
    }
  })

  // If employee completed task, notify admin
  if (session.user.role === "EMPLOYEE" && 
      body.status === "COMPLETED") {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Task Completed ✅",
          message: `${task.assignedTo.name} completed: "${task.title}"`,
          type: "GENERAL",
          isRead: false,
        }
      })
    }
  }

  return NextResponse.json({ task: updated })
}

// DELETE /api/tasks/[id]
// Admin only

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  await prisma.task.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ 
    success: true, 
    message: "Task deleted" 
  })
}
