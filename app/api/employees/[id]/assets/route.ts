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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "all" // "active", "returned", "all"

  let where: any = { userId }
  if (status === "active") {
    where.isReturned = false
  } else if (status === "returned") {
    where.isReturned = true
  }

  try {
    const assets = await prisma.assetAssignment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const userId = params.id

  try {
    const body = await request.json()
    const {
      assetType,
      assetName,
      brand,
      model,
      serialNumber,
      assetTag,
      condition = "GOOD",
      purchaseDate,
      purchaseCost,
      warranty,
      notes,
      imageUrl,
    } = body

    if (!assetType || !assetName) {
      return NextResponse.json({ error: "Asset type and asset name are required" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const asset = await prisma.assetAssignment.create({
      data: {
        userId,
        assetType,
        assetName: assetName.trim(),
        brand: brand ? brand.trim() : null,
        model: model ? model.trim() : null,
        serialNumber: serialNumber ? serialNumber.trim() : null,
        assetTag: assetTag ? assetTag.trim() : null,
        condition: condition || "GOOD",
        assignedDate: new Date(),
        assignedBy: session.user.id,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        warranty: warranty ? new Date(warranty) : null,
        notes: notes ? notes.trim() : null,
        imageUrl: imageUrl || null,
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGN_ASSET",
        details: `Assigned ${asset.assetName} (${asset.assetType}) to ${targetUser.name}`,
      },
    })

    // Create Notification for Employee (Step 8 Requirement)
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "New Asset Assigned 📦",
          message: `You have been assigned a ${asset.assetName}. Please collect it from IT.`,
          type: "GENERAL",
        },
      })
    } catch (e) {
      console.log("[ASSET_POST] Notification failed", e)
    }

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    console.error("[ASSETS_POST]", error)
    return NextResponse.json({ error: "Failed to assign asset" }, { status: 500 })
  }
}
