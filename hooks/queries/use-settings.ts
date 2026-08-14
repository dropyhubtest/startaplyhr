import { useQuery } from "@tanstack/react-query"

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAuditLogs(page: number = 1) {
  return useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?page=${page}&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch audit logs")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}
