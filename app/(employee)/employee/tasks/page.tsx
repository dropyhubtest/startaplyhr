"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { TaskCard } from "@/components/admin/task-card"
import { TaskDetailModal } from "@/components/admin/task-detail-modal"
import { toast } from "sonner"
import { Loader2, CheckSquare, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function EmployeeTasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: tasksQueryData, isLoading: loading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?limit=100")
      if (!res.ok) throw new Error("Failed to load tasks")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const tasks = tasksQueryData?.tasks || []

  const handleTaskUpdate = (updatedTask: any) => {
    queryClient.setQueryData(["my-tasks"], (old: any) => ({
      ...old,
      tasks: old.tasks.map((t: any) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    }))
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        throw new Error()
      }
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] })
    } catch (e) {
      toast.error("Failed to update task status")
    }
  }

  // Group tasks for Board View (3 columns for employee)
  const groupedTasks = {
    TODO: tasks.filter((t: any) => t.status === "TODO"),
    INPROGRESS: tasks.filter((t: any) => t.status === "INPROGRESS"),
    COMPLETED: tasks.filter((t: any) => t.status === "COMPLETED"),
  }

  const columns = [
    { id: "TODO", title: "To Do", tasks: groupedTasks.TODO, color: "bg-slate-50 border-slate-200/70", headerBg: "bg-gradient-to-r from-slate-100 to-slate-50", dot: "bg-slate-400" },
    { id: "INPROGRESS", title: "In Progress", tasks: groupedTasks.INPROGRESS, color: "bg-indigo-50/50 border-indigo-100", headerBg: "bg-gradient-to-r from-indigo-100/50 to-blue-50/50", dot: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" },
    { id: "COMPLETED", title: "Completed", tasks: groupedTasks.COMPLETED, color: "bg-emerald-50/50 border-emerald-100", headerBg: "bg-gradient-to-r from-emerald-100/50 to-green-50/50", dot: "bg-emerald-500" },
  ]

  const overdueCount = tasks.filter((t: any) => 
    t.deadline && new Date(t.deadline) < new Date() && t.status !== "COMPLETED"
  ).length

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto animate-in-fade">
      <PageHeader
        title="My Tasks"
        description="Manage and track your assigned work"
      />

      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-start gap-4 shadow-sm animate-fade-in">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-bold text-[14px]">You have {overdueCount} overdue task(s)</p>
            <p className="text-[13px] font-medium text-rose-700/80 mt-0.5">Please complete them as soon as possible or discuss with your manager.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-center justify-center min-h-[400px] p-8 animate-fade-in">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <CheckSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900 mb-1">No tasks assigned</h3>
          <p className="text-slate-500 text-[13px] font-medium text-center max-w-sm">
            You currently have no tasks assigned to you. Enjoy your free time!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex gap-5 min-w-max h-full">
            {columns.map(col => (
              <div key={col.id} className={cn("w-[340px] rounded-xl border shadow-sm flex flex-col max-h-[calc(100vh-220px)]", col.color)}>
                <div className={cn("px-4 py-3 border-b border-slate-100/50 flex items-center justify-between rounded-t-xl shrink-0", col.headerBg)}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                    <h3 className="font-semibold text-slate-900 text-[14px] uppercase tracking-wider">{col.title}</h3>
                  </div>
                  <span className="bg-white text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm border border-slate-200/50 min-w-[24px] text-center">
                    {col.tasks.length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                  {col.tasks.map((task: any) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => setSelectedTaskId(task.id)} 
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {col.tasks.length === 0 && (
                    <div className="text-center py-10 text-[12px] font-medium text-slate-400 border-2 border-dashed border-slate-200/50 rounded-lg bg-white/30">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TaskDetailModal 
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={handleTaskUpdate}
      />
    </div>
  )
}
