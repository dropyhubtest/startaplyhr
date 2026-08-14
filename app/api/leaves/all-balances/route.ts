import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leaves/all-balances
// Admin only - all employees' leave balances

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, employeeId: true, department: true }
    })

    const currentYear = new Date().getFullYear()

    // Ensure all active employees have a balance record
    await Promise.all(
      employees.map(async (emp) => {
        const existing = await prisma.leaveBalance.findUnique({
          where: { userId: emp.id }
        })
        if (!existing) {
          await prisma.leaveBalance.create({
            data: {
              userId: emp.id,
              year: currentYear,
              sickLeave: 10,
              casualLeave: 12,
              paidLeave: 15,
              wfhLeave: 24,
              usedSick: 0,
              usedCasual: 0,
              usedPaid: 0,
              usedWFH: 0,
            }
          })
        }
      })
    )

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
  } catch (error) {
    console.error("[ALL_BALANCES_API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch balances", balances: [] }, { status: 500 })
  }
}
