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
    const contact = await prisma.emergencyContact.findUnique({
      where: { userId },
    })

    return NextResponse.json({ emergencyContact: contact || null })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch emergency contact" }, { status: 500 })
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
    const { name, relationship, primaryPhone, secondaryPhone, email, address, notes } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Emergency contact name is required (min 2 characters)" }, { status: 400 })
    }

    if (!relationship) {
      return NextResponse.json({ error: "Relationship is required" }, { status: 400 })
    }

    if (!primaryPhone || !/^\d{10}$/.test(primaryPhone.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Primary phone is required and must be 10 digits" }, { status: 400 })
    }

    if (secondaryPhone && !/^\d{10}$/.test(secondaryPhone.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Secondary phone must be 10 digits" }, { status: 400 })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const contactData = {
      name: name.trim(),
      relationship,
      primaryPhone: primaryPhone.trim(),
      secondaryPhone: secondaryPhone ? secondaryPhone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null,
    }

    const emergencyContact = await prisma.emergencyContact.upsert({
      where: { userId },
      update: contactData,
      create: {
        userId,
        ...contactData,
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_EMERGENCY_CONTACT",
        details: `Updated emergency contact (${contactData.name}) for employee (${userId})`,
      },
    })

    return NextResponse.json({ success: true, emergencyContact })
  } catch (error) {
    console.error("[EMERGENCY_CONTACT_PUT]", error)
    return NextResponse.json({ error: "Failed to update emergency contact" }, { status: 500 })
  }
}
