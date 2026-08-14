import { useQuery } from "@tanstack/react-query"

export function usePendingLeaves() {
  return useQuery({
    queryKey: ["leaves", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/leaves?status=PENDING&limit=50")
      if (!res.ok) throw new Error("Failed to fetch pending leaves")
      return res.json()
    },
    staleTime: 15 * 1000,
  })
}

export function useAllLeaves(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["leaves", "all", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            params.append(key, String(val))
          }
        })
      }
      const res = await fetch(`/api/leaves?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch leaves")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: ["leaves", "balance"],
    queryFn: async () => {
      const res = await fetch("/api/leaves/balance")
      if (!res.ok) throw new Error("Failed to fetch leave balance")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

export function useLeaveCalendar(month: number, year: number) {
  return useQuery({
    queryKey: ["leaves", "calendar", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/leaves/calendar?month=${month}&year=${year}`)
      if (!res.ok) throw new Error("Failed to fetch leave calendar")
      return res.json()
    },
    enabled: !!month && !!year,
    staleTime: 60 * 1000,
  })
}

export function useAllBalances() {
  return useQuery({
    queryKey: ["leaves", "all-balances"],
    queryFn: async () => {
      const res = await fetch("/api/leaves/all-balances")
      if (!res.ok) throw new Error("Failed to fetch leave balances")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}
