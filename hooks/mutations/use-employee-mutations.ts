import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create employee")
      }
      return res.json()
    },
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] })
      const previous = queryClient.getQueryData(["employees"])

      queryClient.setQueryData(["employees"], (old: any) => {
        if (!old) return old
        const employeesList = old.employees || []
        return {
          ...old,
          employees: [
            {
              ...newEmployee,
              id: "temp-" + Date.now(),
              isOptimistic: true,
            },
            ...employeesList,
          ],
        }
      })

      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Employee created successfully!")
    },
    onError: (err: any, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["employees"], context.previous)
      }
      toast.error(err.message || "Failed to create employee")
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update employee")
      }
      return res.json()
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["employees", id] })
      const previous = queryClient.getQueryData(["employees", id])

      queryClient.setQueryData(["employees", id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          employee: { ...old.employee, ...data },
        }
      })

      return { previous }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employees", id] })
      toast.success("Employee details updated!")
    },
    onError: (err: any, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["employees", id], context.previous)
      }
      toast.error(err.message || "Failed to update employee")
    },
  })
}

export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees/${id}/toggle-status`, {
        method: "PUT",
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employees", id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Employee status updated!")
    },
    onError: () => {
      toast.error("Failed to update employee status")
    },
  })
}
