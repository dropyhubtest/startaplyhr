import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user || !user.isFirstLogin) {
    return NextResponse.json({ error: "Not eligible for first login change" }, { status: 400 })
  }

  const body = await request.json()
  const { newPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { 
      password: hashedPassword,
      isFirstLogin: false 
    }
  })

  // We don't automatically update the token in NextAuth directly here. 
  // The frontend should call next-auth update() or force a sign out / sign in
  // Usually, calling update() on session works if configured.

  return NextResponse.json({ success: true, message: "Password updated successfully" })
}
