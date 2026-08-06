"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

interface CreateTaskModalProps {
  open: boolean
  employees: any[]
  onClose: () => void
  onSuccess: (task: any) => void
}

export function CreateTaskModal({ open, employees, onClose, onSuccess }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm()
  
  const selectedPriority = watch("priority")

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (res.ok) {
        toast.success("Task created and assigned!")
        onSuccess(result.task)
        reset()
        onClose()
      } else {
        toast.error(result.error || "Failed to create task")
      }
    } catch (e) {
      toast.error("An error occurred while creating task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Task Title</label>
            <Input {...register("title", { required: true })} placeholder="e.g. Prepare Q3 presentation" />
            {errors.title && <span className="text-xs text-red-500">Title is required</span>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Textarea 
              {...register("description")} 
              placeholder="Provide any details, links, or context for the task..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Assign To</label>
              <Select onValueChange={(v) => setValue("assignedToId", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-indigo-700">{getInitials(emp.name)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">{emp.name}</p>
                          <p className="text-[10px] text-gray-500">{emp.department}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Deadline</label>
              <Input type="date" {...register("deadline")} min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
            <div className="grid grid-cols-3 gap-3">
              {["HIGH", "MEDIUM", "LOW"].map((p) => {
                const isSelected = selectedPriority === p
                return (
                  <label key={p} className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    isSelected ? (
                      p === "HIGH" ? "border-red-500 bg-red-50 text-red-700" :
                      p === "MEDIUM" ? "border-yellow-500 bg-yellow-50 text-yellow-700" :
                      "border-green-500 bg-green-50 text-green-700"
                    ) : "border-gray-200 hover:border-gray-300"
                  )}>
                    <input type="radio" className="hidden" value={p} {...register("priority", { required: true })} />
                    <span className="text-lg">
                      {p === "HIGH" ? "🔴" : p === "MEDIUM" ? "🟡" : "🟢"}
                    </span>
                    <span className="text-xs font-medium capitalize">
                      {p.toLowerCase()}
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.priority && <span className="text-xs text-red-500 mt-1 block">Priority is required</span>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !watch("assignedToId")}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
