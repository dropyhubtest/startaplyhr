"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const user = session?.user
  const role = user?.role
  
  const isAdmin = role === "ADMIN"
  const isEmployee = role === "EMPLOYEE"
  
  const requireAdmin = () => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login")
    }
  }
  
  const requireEmployee = () => {
    if (!isLoading && (!isAuthenticated || !isEmployee)) {
      router.push("/login")
    }
  }
  
  return {
    user,
    role,
    isAdmin,
    isEmployee,
    isLoading,
    isAuthenticated,
    requireAdmin,
    requireEmployee,
    session,
    updateSession: update,
  }
}
