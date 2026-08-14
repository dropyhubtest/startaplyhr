"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import EmployeeSidebar from "@/components/employee/sidebar"
import AdminTopbar from "@/components/admin/topbar"
import { usePusherIntegration } from "@/hooks/use-pusher-integration"
import { RefreshIndicator } from "@/components/ui-v2/refresh-indicator"
import { useCascadePrefetch } from "@/hooks/use-cascade-prefetch"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session, status } = useSession()

  usePusherIntegration(session?.user?.id)

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/employee"

  useEffect(() => {
    import("@/lib/perf-monitor").then((m) => {
      m.logNavigation(pathname)
    })
  }, [pathname])

  useCascadePrefetch({
    role: "EMPLOYEE",
    userId: session?.user?.id,
    dashboardQueriesReady: status === "authenticated",
  })

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not employee
  if (status === "unauthenticated" || session?.user?.role !== "EMPLOYEE") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <EmployeeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content - offset by sidebar width on desktop */}
      <div className="lg:ml-[248px] flex flex-col min-h-screen">
        {/* Topbar (reused for mobile menu toggle and notifications) */}
        <AdminTopbar 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
          <RefreshIndicator />
          {children}
        </main>
      </div>
    </div>
  )
}
