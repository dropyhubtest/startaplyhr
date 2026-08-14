import { useQuery } from "@tanstack/react-query"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch dashboard stats")
      return res.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  })
}

export function useLiveStatus() {
  return useQuery({
    queryKey: ["live-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/live-status")
      if (!res.ok) throw new Error("Failed to fetch live status")
      const data = await res.json()
      return Array.isArray(data) ? data : (data.employees || [])
    },
    staleTime: 5 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  })
}

export function useWeeklyAttendance() {
  return useQuery({
    queryKey: ["weekly-attendance"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/weekly-attendance")
      if (!res.ok) throw new Error("Failed to fetch weekly attendance")
      const data = await res.json()
      return Array.isArray(data) ? data : (data.summary || data.attendance || [])
    },
    staleTime: 60 * 1000,
  })
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/activity-feed")
      if (!res.ok) throw new Error("Failed to fetch activity feed")
      const data = await res.json()
      return Array.isArray(data) ? data : (data.activities || [])
    },
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    refetchIntervalInBackground: false,
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/task-stats")
      if (!res.ok) throw new Error("Failed to fetch task stats")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}
