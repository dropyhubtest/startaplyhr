import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { date, isWorkingDay } = await request.json()

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const overrideDate = new Date(date)
    overrideDate.setHours(0, 0, 0, 0)

    const override = await prisma.workingDayOverride.upsert({
      where: { date: overrideDate },
      update: { isWorkingDay },
      create: { date: overrideDate, isWorkingDay }
    })

    return NextResponse.json(override)
  } catch (error) {
    console.error("Override API Error:", error)
    return NextResponse.json({ error: "Failed to set override" }, { status: 500 })
  }
}
