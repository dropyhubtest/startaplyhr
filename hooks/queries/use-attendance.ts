import { useQuery } from "@tanstack/react-query"

export function useAttendanceToday(dateStr?: string) {
  const date = dateStr || new Date().toISOString().split("T")[0]
  return useQuery({
    queryKey: ["attendance", "today", date],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/admin/today?date=${date}`)
      if (!res.ok) throw new Error("Failed to fetch today attendance")
      return res.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  })
}

export function useAttendanceHistory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["attendance", "history", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/admin/history?startDate=${startDate}&endDate=${endDate}`)
      if (!res.ok) throw new Error("Failed to fetch attendance history")
      return res.json()
    },
    enabled: !!startDate && !!endDate,
    staleTime: 60 * 1000,
  })
}

export function useEmployeeAttendance(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: ["attendance", "employee", employeeId, month, year],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/attendance?month=${month}&year=${year}`)
      if (!res.ok) throw new Error("Failed to fetch employee attendance")
      return res.json()
    },
    enabled: !!employeeId && !!month && !!year,
    staleTime: 60 * 1000,
  })
}
