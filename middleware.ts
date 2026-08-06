import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // 1. If user is not authenticated and trying to access a protected route
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. If user is authenticated and trying to access login page
  if (token && pathname === "/login") {
    if (token.isFirstLogin) {
      return NextResponse.redirect(new URL("/change-password", request.url))
    }
    const role = (token as any).role
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/employee/dashboard", request.url))
  }

  // 2.5 Force first login users to change password
  if (token && token.isFirstLogin === true) {
    if (
      !pathname.startsWith("/change-password") && 
      !pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/change-password", request.url))
    }
  }

  // 3. Role-based access control
  if (token) {
    const role = (token as any).role

    // Admin routes protection
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url))
    }

    // Employee routes protection
    if (pathname.startsWith("/employee") && role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
