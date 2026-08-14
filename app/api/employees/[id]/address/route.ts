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
    const address = await prisma.employeeAddress.findUnique({
      where: { userId },
    })

    return NextResponse.json({ address: address || null })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 })
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
      currentStreet,
      currentCity,
      currentState,
      currentCountry = "India",
      currentZipCode,
      currentLandmark,
      permanentStreet,
      permanentCity,
      permanentState,
      permanentCountry = "India",
      permanentZipCode,
      permanentLandmark,
      sameAsCurrent = false,
    } = body

    // Validation
    if (currentZipCode && !/^\d{6}$/.test(currentZipCode.trim())) {
      return NextResponse.json({ error: "Current zip code must be 6 digits" }, { status: 400 })
    }

    if (!sameAsCurrent && permanentZipCode && !/^\d{6}$/.test(permanentZipCode.trim())) {
      return NextResponse.json({ error: "Permanent zip code must be 6 digits" }, { status: 400 })
    }

    const addressData = {
      currentStreet: currentStreet || null,
      currentCity: currentCity || null,
      currentState: currentState || null,
      currentCountry: currentCountry || "India",
      currentZipCode: currentZipCode || null,
      currentLandmark: currentLandmark || null,
      sameAsCurrent: !!sameAsCurrent,
      permanentStreet: sameAsCurrent ? currentStreet || null : permanentStreet || null,
      permanentCity: sameAsCurrent ? currentCity || null : permanentCity || null,
      permanentState: sameAsCurrent ? currentState || null : permanentState || null,
      permanentCountry: sameAsCurrent ? currentCountry || "India" : permanentCountry || "India",
      permanentZipCode: sameAsCurrent ? currentZipCode || null : permanentZipCode || null,
      permanentLandmark: sameAsCurrent ? currentLandmark || null : permanentLandmark || null,
    }

    const address = await prisma.employeeAddress.upsert({
      where: { userId },
      update: addressData,
      create: {
        userId,
        ...addressData,
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_ADDRESS",
        details: `Updated address for employee (${userId})`,
      },
    })

    return NextResponse.json({ success: true, address })
  } catch (error) {
    console.error("[ADDRESS_PUT]", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}
