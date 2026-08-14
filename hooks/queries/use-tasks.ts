import { useQuery } from "@tanstack/react-query"

export function useTasks(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" })
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "" && val !== "all") {
            params.append(key, String(val))
          }
        })
      }
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
