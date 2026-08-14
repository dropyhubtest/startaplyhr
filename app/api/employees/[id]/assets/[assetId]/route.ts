import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; assetId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { id: userId, assetId } = params

  try {
    const body = await request.json()
    const {
      assetType,
      assetName,
      brand,
      model,
      serialNumber,
      assetTag,
      condition,
      purchaseDate,
      purchaseCost,
      warranty,
      notes,
      imageUrl,
    } = body

    const existing = await prisma.assetAssignment.findUnique({
      where: { id: assetId },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Asset assignment not found" }, { status: 404 })
    }

    const updated = await prisma.assetAssignment.update({
      where: { id: assetId },
      data: {
        assetType: assetType || existing.assetType,
        assetName: assetName !== undefined ? assetName.trim() : existing.assetName,
        brand: brand !== undefined ? (brand ? brand.trim() : null) : existing.brand,
        model: model !== undefined ? (model ? model.trim() : null) : existing.model,
        serialNumber: serialNumber !== undefined ? (serialNumber ? serialNumber.trim() : null) : existing.serialNumber,
        assetTag: assetTag !== undefined ? (assetTag ? assetTag.trim() : null) : existing.assetTag,
        condition: condition || existing.condition,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existing.purchaseDate,
        purchaseCost: purchaseCost !== undefined ? (purchaseCost ? parseFloat(purchaseCost) : null) : existing.purchaseCost,
        warranty: warranty !== undefined ? (warranty ? new Date(warranty) : null) : existing.warranty,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_ASSET",
        details: `Updated details for asset ${updated.assetName} (${assetId})`,
      },
    })

    return NextResponse.json({ success: true, asset: updated })
  } catch (error) {
    console.error("[ASSET_PUT]", error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Deleting asset record is not allowed. Please use return endpoint instead." },
    { status: 405 }
  )
}
