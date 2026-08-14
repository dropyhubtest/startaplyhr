import { useQuery } from "@tanstack/react-query"

export function useEmployees(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value))
          }
        })
      }
      const res = await fetch(`/api/employees?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch employees")
      return res.json()
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`)
      if (!res.ok) throw new Error("Failed to fetch employee")
      return res.json()
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
