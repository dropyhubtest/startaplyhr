import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNotification } from "@/lib/utils"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const announcements = await prisma.announcement.findMany({
    include: {
      createdBy: {
        select: { name: true, employeeId: true }
      }
    },
    orderBy: [
      { isUrgent: "desc" },
      { createdAt: "desc" }
    ],
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.announcement.count()

  return NextResponse.json({ announcements, total, page })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, content, isUrgent } = body

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
  }

  if (title.length < 3) {
    return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 })
  }

  if (content.length < 10) {
    return NextResponse.json({ error: "Content must be at least 10 characters" }, { status: 400 })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      isUrgent: isUrgent || false,
      targetAll: true,
      createdById: session.user.id,
    },
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  })

  // Send real-time notification to all active employees
  prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true }
  }).then((employees) => {
    employees.forEach((emp) => {
      sendNotification(
        emp.id,
        isUrgent ? `🔴 URGENT: ${title}` : `📢 ${title}`,
        content.slice(0, 100) + (content.length > 100 ? "..." : ""),
        "ANNOUNCEMENT"
      ).catch(() => {})
    })
  }).catch(() => {})

  return NextResponse.json({ announcement }, { status: 201 })
}
