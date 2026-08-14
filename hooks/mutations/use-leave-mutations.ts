import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useApproveLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leaveId: string) => {
      const res = await fetch(`/api/leaves/${leaveId}/approve`, { method: "PUT" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to approve leave")
      }
      return res.json()
    },
    onMutate: async (leaveId) => {
      await queryClient.cancelQueries({ queryKey: ["leaves"] })
      const previousPending = queryClient.getQueryData(["leaves", "pending"])

      queryClient.setQueryData(["leaves", "pending"], (old: any) => {
        if (!old || !old.leaves) return old
        return {
          ...old,
          leaves: old.leaves.filter((l: any) => l.id !== leaveId),
        }
      })

      return { previousPending }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Leave approved!")
    },
    onError: (err: any, _, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(["leaves", "pending"], context.previousPending)
      }
      toast.error(err.message || "Failed to approve leave")
    },
  })
}

export function useRejectLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leaveId, adminComment }: { leaveId: string; adminComment: string }) => {
      const res = await fetch(`/api/leaves/${leaveId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminComment }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to reject leave")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Leave request rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject leave")
    },
  })
}

export function useApplyLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to apply for leave")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      toast.success("Leave application submitted!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave application")
    },
  })
}

export function useCancelLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leaveId: string) => {
      const res = await fetch(`/api/leaves/${leaveId}/cancel`, { method: "PUT" })
      if (!res.ok) throw new Error("Failed to cancel leave")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      toast.success("Leave cancelled successfully")
    },
    onError: () => {
      toast.error("Failed to cancel leave")
    },
  })
}
