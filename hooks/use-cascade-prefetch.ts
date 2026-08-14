"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"

/**
 * UNIVERSAL CASCADING PREFETCH STRATEGY
 * 
 * Initiates background prefetching from whichever page
 * the user lands on or refreshes.
 */

interface CascadePrefetchOptions {
  role: "ADMIN" | "EMPLOYEE"
  userId?: string
  dashboardQueriesReady?: boolean
}

export function useCascadePrefetch(options: CascadePrefetchOptions) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const hasPrefetchedRef = useRef(false)

  const isReady = options.dashboardQueriesReady !== undefined ? options.dashboardQueriesReady : true

  useEffect(() => {
    // Only prefetch once ready
    if (!isReady) return
    
    // Only prefetch once per session
    if (hasPrefetchedRef.current) return
    
    hasPrefetchedRef.current = true
    
    const startPrefetch = async () => {
      if (options.role === "ADMIN") {
        await prefetchAdminPages(queryClient)
      } else {
        await prefetchEmployeePages(queryClient, options.userId)
      }
    }
    
    // Wait 500ms after current page is ready so active view renders smoothly first
    const timer = setTimeout(startPrefetch, 500)
    return () => clearTimeout(timer)
  }, [isReady, options.role, options.userId, pathname, queryClient])
}

/**
 * Prefetch all admin pages in priority order
 */
async function prefetchAdminPages(queryClient: any) {
  // Priority 1: Most-used pages
  const priority1 = [
    {
      key: ["employees", { page: 1, limit: 10 }],
      url: "/api/employees?page=1&limit=10",
      label: "Employees"
    },
    {
      key: ["attendance-today"],
      url: "/api/attendance/admin/today",
      label: "Attendance Today"
    },
  ]
  
  // Priority 2: Frequently accessed
  const priority2 = [
    {
      key: ["leaves", { status: "PENDING" }],
      url: "/api/leaves?status=PENDING",
      label: "Pending Leaves"
    },
    {
      key: ["tasks"],
      url: "/api/tasks",
      label: "Tasks"
    },
    {
      key: ["jobs", { status: "all", priority: "all", assignedTo: "all", search: "" }],
      url: "/api/jobs",
      label: "Recruitment Jobs"
    },
  ]
  
  // Priority 3: Less frequent
  const priority3 = [
    {
      key: ["announcements"],
      url: "/api/announcements",
      label: "Announcements"
    },
    {
      key: ["notifications"],
      url: "/api/notifications",
      label: "Notifications"
    },
    {
      key: ["settings"],
      url: "/api/settings",
      label: "Settings"
    },
  ]
  
  // Load priority 1 in parallel
  await Promise.all(
    priority1.map(item => 
      queryClient.prefetchQuery({
        queryKey: item.key,
        queryFn: async () => {
          const res = await fetch(item.url)
          if (!res.ok) throw new Error(`Failed: ${item.label}`)
          return res.json()
        },
        staleTime: 5 * 60 * 1000,
      })
    )
  )
  
  // Then priority 2
  await Promise.all(
    priority2.map(item =>
      queryClient.prefetchQuery({
        queryKey: item.key,
        queryFn: async () => {
          const res = await fetch(item.url)
          if (!res.ok) throw new Error(`Failed: ${item.label}`)
          return res.json()
        },
        staleTime: 5 * 60 * 1000,
      })
    )
  )
  
  // Then priority 3
  await Promise.all(
    priority3.map(item =>
      queryClient.prefetchQuery({
        queryKey: item.key,
        queryFn: async () => {
          const res = await fetch(item.url)
          if (!res.ok) throw new Error(`Failed: ${item.label}`)
          return res.json()
        },
        staleTime: 5 * 60 * 1000,
      })
    )
  )
}

/**
 * Prefetch employee pages
 */
async function prefetchEmployeePages(queryClient: any, _userId?: string) {
  const pages = [
    {
      key: ["my-attendance"],
      url: "/api/attendance/today",
      label: "My Attendance",
    },
    {
      key: ["my-leaves"],
      url: "/api/leaves",
      label: "My Leaves",
    },
    {
      key: ["my-tasks"],
      url: "/api/tasks",
      label: "My Tasks",
    },
    {
      key: ["announcements"],
      url: "/api/announcements",
      label: "Announcements",
    },
    {
      key: ["notifications"],
      url: "/api/notifications",
      label: "Notifications",
    },
    {
      key: ["profile"],
      url: "/api/profile",
      label: "Profile",
    },
    {
      key: ["my-jobs", { status: "all", priority: "all" }],
      url: "/api/jobs",
      label: "My Recruitment Jobs",
    },
  ]
  
  await Promise.all(
    pages.map(page =>
      queryClient.prefetchQuery({
        queryKey: page.key,
        queryFn: async () => {
          const res = await fetch(page.url)
          if (!res.ok) throw new Error(`Failed: ${page.label}`)
          return res.json()
        },
        staleTime: 5 * 60 * 1000,
      })
    )
  )
}

