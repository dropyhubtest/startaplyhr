import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/leaves/all-balances
// Admin only - all employees' leave balances

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const balances = await prisma.leaveBalance.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          department: true,
          isActive: true,
        }
      }
    },
    where: {
      user: { isActive: true }
    }
  })

  return NextResponse.json({ balances })
}
