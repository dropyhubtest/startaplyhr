import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
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
    const { returnCondition = "GOOD", notes } = body

    const existing = await prisma.assetAssignment.findUnique({
      where: { id: assetId },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Asset assignment not found" }, { status: 404 })
    }

    if (existing.isReturned) {
      return NextResponse.json({ error: "Asset has already been marked as returned" }, { status: 400 })
    }

    const updated = await prisma.assetAssignment.update({
      where: { id: assetId },
      data: {
        isReturned: true,
        returnedDate: new Date(),
        returnedTo: session.user.id,
        returnCondition: returnCondition || "GOOD",
        notes: notes ? (existing.notes ? `${existing.notes}\n[Return Note]: ${notes}` : notes) : existing.notes,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RETURN_ASSET",
        details: `Marked asset ${updated.assetName} as returned by employee (${userId}) in ${returnCondition} condition`,
      },
    })

    return NextResponse.json({ success: true, asset: updated })
  } catch (error) {
    console.error("[ASSET_RETURN]", error)
    return NextResponse.json({ error: "Failed to process asset return" }, { status: 500 })
  }
}
