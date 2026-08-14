import { useQuery } from "@tanstack/react-query"

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  })
}
