import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

// GET /api/tasks
// Admin: all tasks with filters
// Employee: only own assigned tasks

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || ""
  const priority = searchParams.get("priority") || ""
  const assignedTo = searchParams.get("assignedTo") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")

  let where: any = {}

  // Employee sees only own tasks
  if (session.user.role === "EMPLOYEE") {
    where.assignedToId = session.user.id
  } else {
    // Admin filters
    if (assignedTo && assignedTo !== "all") where.assignedToId = assignedTo
  }

  if (status && status !== "all") where.status = status
  if (priority && priority !== "all") where.priority = priority

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            department: true,
            profilePhoto: true,
          }
        },
        assignedBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [
        { priority: "asc" },
        { deadline: "asc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where })
  ])

  return NextResponse.json({ tasks, total, page, limit })
}

// POST /api/tasks
// Admin only - Create task

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const body = await request.json()
  const { title, description, assignedToId, priority, deadline } = body

  if (!title || !assignedToId || !priority) {
    return NextResponse.json(
      { error: "Title, assignee and priority are required" },
      { status: 400 }
    )
  }

  // Verify assignee exists
  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { name: true, id: true }
  })

  if (!assignee) {
    return NextResponse.json(
      { error: "Assigned employee not found" },
      { status: 404 }
    )
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      assignedToId,
      assignedById: session.user.id,
      priority,
      status: "TODO",
      deadline: deadline ? new Date(deadline) : null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        }
      },
      assignedBy: {
        select: { name: true }
      },
      _count: { select: { comments: true } }
    }
  })

  // Notify assigned employee
  sendNotification(
    assignedToId,
    "New Task Assigned 📋",
    `You have been assigned: "${title}"${deadline ? ` - Due ${new Date(deadline).toLocaleDateString()}` : ""}`,
    "TASK_ASSIGNED"
  ).catch(() => {})

  // Notify creating admin
  sendNotification(
    session.user.id,
    "Task Created 📋",
    `Task "${title}" created and assigned to ${assignee.name}.`,
    "TASK_ASSIGNED"
  ).catch(() => {})

  return NextResponse.json({ task }, { status: 201 })
}
