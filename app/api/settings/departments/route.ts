import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const employees = await prisma.user.findMany({
    where: { isActive: true },
    select: { department: true },
    distinct: ["department"],
  })

  const departments = employees.map((e: any) => e.department)

  return NextResponse.json({ departments })
}
