import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create task")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-stats"] })
      toast.success("Task created!")
    },
    onError: () => {
      toast.error("Failed to create task")
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update task status")
      return res.json()
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      const previousTasks = queryClient.getQueryData(["tasks"])

      queryClient.setQueryData(["tasks"], (old: any) => {
        if (!old || !old.tasks) return old
        return {
          ...old,
          tasks: old.tasks.map((t: any) => (t.id === taskId ? { ...t, status } : t)),
        }
      })

      return { previousTasks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-stats"] })
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      toast.error("Failed to update status")
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete task")
      return res.json()
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      const previousTasks = queryClient.getQueryData(["tasks"])

      queryClient.setQueryData(["tasks"], (old: any) => {
        if (!old || !old.tasks) return old
        return {
          ...old,
          tasks: old.tasks.filter((t: any) => t.id !== taskId),
        }
      })

      return { previousTasks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-stats"] })
      toast.success("Task deleted")
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      toast.error("Failed to delete task")
    },
  })
}
