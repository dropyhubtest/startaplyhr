import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/leaves/calendar
// Admin only
// Query: month (1-12), year (YYYY)
// Returns approved leaves for calendar view

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const month = parseInt(
    searchParams.get("month") || 
    String(new Date().getMonth() + 1)
  )
  const year = parseInt(
    searchParams.get("year") || 
    String(new Date().getFullYear())
  )

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const leaves = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    include: {
      user: {
        select: {
          name: true,
          employeeId: true,
          department: true,
        }
      }
    }
  })

  // Build a map: date string → employees on leave
  const calendarMap: Record<string, any[]> = {}

  leaves.forEach(leave => {
    const current = new Date(leave.startDate)
    const end = new Date(leave.endDate)

    while (current <= end) {
      if (current >= monthStart && current <= monthEnd) {
        const dateKey = current.toISOString().split("T")[0]
        if (!calendarMap[dateKey]) {
          calendarMap[dateKey] = []
        }
        calendarMap[dateKey].push({
          name: leave.user.name,
          employeeId: leave.user.employeeId,
          department: leave.user.department,
          leaveType: leave.leaveType,
        })
      }
      current.setDate(current.getDate() + 1)
    }
  })

  return NextResponse.json({ 
    calendarMap, 
    month, 
    year,
    totalLeaves: leaves.length
  })
}
