import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = params.id
  if (session.user.role === "EMPLOYEE" && session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        nationality: true,
        bloodGroup: true,
        personalEmail: true,
        alternatePhone: true,
        languagesKnown: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json({ personalInfo: user })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch personal info" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = params.id
  const isAdmin = session.user.role === "ADMIN"
  const isSelf = session.user.id === userId

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      personalEmail,
      alternatePhone,
      languagesKnown,
    } = body

    // Validation
    if (personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      return NextResponse.json({ error: "Invalid personal email address" }, { status: 400 })
    }

    if (alternatePhone && !/^\d{10}$/.test(alternatePhone.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Alternate phone must be 10 digits" }, { status: 400 })
    }

    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth)
      const age = (new Date().getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 18) {
        return NextResponse.json({ error: "Employee must be at least 18 years old" }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        maritalStatus: maritalStatus || null,
        nationality: nationality || null,
        bloodGroup: bloodGroup || null,
        personalEmail: personalEmail || null,
        alternatePhone: alternatePhone || null,
        languagesKnown: languagesKnown || null,
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        nationality: true,
        bloodGroup: true,
        personalEmail: true,
        alternatePhone: true,
        languagesKnown: true,
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PERSONAL_INFO",
        details: `Updated personal information for employee ${updatedUser.name} (${userId})`,
      },
    })

    return NextResponse.json({ success: true, personalInfo: updatedUser })
  } catch (error) {
    console.error("[PERSONAL_INFO_PUT]", error)
    return NextResponse.json({ error: "Failed to update personal info" }, { status: 500 })
  }
}
