import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      employeeId: true,
      department: true,
      profilePhoto: true,
      isActive: true,
      // Personal info
      dateOfBirth: true,
      gender: true,
      maritalStatus: true,
      nationality: true,
      bloodGroup: true,
      personalEmail: true,
      alternatePhone: true,
      languagesKnown: true,
      // Relations
      address: true,
      emergencyContact: true,
      assetsAssigned: {
        orderBy: { createdAt: "desc" },
      },
    }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Valid name is required" }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { id: true, name: true, profilePhoto: true }
  })

  return NextResponse.json({ user: updatedUser })
}
