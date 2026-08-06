"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskCard } from "@/components/admin/task-card"
import { CreateTaskModal } from "@/components/admin/create-task-modal"
import { TaskDetailModal } from "@/components/admin/task-detail-modal"
import { toast } from "sonner"
import { Plus, LayoutGrid, List as ListIcon, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "100", // Fetch enough for board view
        assignedTo: employeeFilter,
        priority: priorityFilter
      })
      const res = await fetch(`/api/tasks?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
      }
    } catch (e) {
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [employeeFilter, priorityFilter])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?limit=100")
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
  }, [fetchTasks, fetchEmployees])

  const handleTaskUpdate = (updatedTask: any) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // Group tasks for Board View
  const groupedTasks = {
    TODO: tasks.filter(t => t.status === "TODO"),
    INPROGRESS: tasks.filter(t => t.status === "INPROGRESS"),
    COMPLETED: tasks.filter(t => t.status === "COMPLETED"),
    BLOCKED: tasks.filter(t => t.status === "BLOCKED"),
  }

  const columns = [
    { id: "TODO", title: "To Do", tasks: groupedTasks.TODO, color: "bg-slate-50 border-slate-200/60", dot: "bg-slate-400" },
    { id: "INPROGRESS", title: "In Progress", tasks: groupedTasks.INPROGRESS, color: "bg-indigo-50/50 border-indigo-100", dot: "bg-indigo-500" },
    { id: "COMPLETED", title: "Completed", tasks: groupedTasks.COMPLETED, color: "bg-emerald-50/50 border-emerald-100", dot: "bg-emerald-500" },
    { id: "BLOCKED", title: "Blocked", tasks: groupedTasks.BLOCKED, color: "bg-rose-50/50 border-rose-100", dot: "bg-rose-500" },
  ]

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto">
      <PageHeader
        title="Task Management"
        description="Assign, track, and manage employee tasks"
        action={
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-medium shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={employeeFilter} onValueChange={(v) => setEmployeeFilter(v as string)}>
            <SelectTrigger className="w-[180px] bg-white h-9 border-slate-200 text-[13px] shadow-sm focus:border-indigo-500">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 shadow-lg rounded-lg">
              <SelectItem value="all">All Assignees</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as string)}>
            <SelectTrigger className="w-[150px] bg-white h-9 border-slate-200 text-[13px] shadow-sm focus:border-indigo-500">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 shadow-lg rounded-lg">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High Priority</SelectItem>
              <SelectItem value="MEDIUM">Medium Priority</SelectItem>
              <SelectItem value="LOW">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg flex items-center shrink-0 border border-slate-200/50">
          <button 
            onClick={() => setViewMode("board")}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
              viewMode === "board" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2" />
            Board
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
              viewMode === "list" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ListIcon className="w-3.5 h-3.5 mr-2" />
            List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-center justify-center min-h-[400px] p-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-1">No tasks found</h3>
          <p className="text-[13px] text-slate-500 mb-6 text-center max-w-sm">
            There are no tasks matching your current filters. Create a new task to get started.
          </p>
          <button 
            onClick={() => setCreateModalOpen(true)} 
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create First Task
          </button>
        </div>
      ) : viewMode === "board" ? (
        /* KANBAN BOARD VIEW */
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar animate-fade-in">
          <div className="flex gap-5 min-w-max h-full">
            {columns.map(col => (
              <div key={col.id} className={cn("w-[340px] rounded-xl border flex flex-col max-h-[calc(100vh-280px)] shadow-sm", col.color)}>
                <div className="px-4 py-3 border-b border-[inherit] flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-t-xl shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                    <h3 className="text-[14px] font-bold text-slate-900">{col.title}</h3>
                  </div>
                  <span className="bg-white text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-200">
                    {col.tasks.length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                  {col.tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => setSelectedTaskId(task.id)} 
                    />
                  ))}
                  {col.tasks.length === 0 && (
                    <div className="text-center py-10 text-[13px] font-medium text-slate-400 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/50">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex-1 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Task Name</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Assignee</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Status</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Priority</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[13.5px] text-slate-900 max-w-[300px] truncate leading-tight">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-700">{task.assignedTo?.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border shadow-sm",
                        task.status === "TODO" && "bg-slate-50 text-slate-600 border-slate-200",
                        task.status === "INPROGRESS" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                        task.status === "COMPLETED" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        task.status === "BLOCKED" && "bg-rose-50 text-rose-700 border-rose-200",
                      )}>
                        {(task.status || "").replace("INPROGRESS", "IN PROGRESS")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[12px] font-bold",
                        task.priority === "HIGH" && "text-rose-600",
                        task.priority === "MEDIUM" && "text-amber-600",
                        task.priority === "LOW" && "text-emerald-600",
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        employees={employees}
        onSuccess={(newTask) => {
          setTasks(prev => [newTask, ...prev])
        }}
      />

      <TaskDetailModal 
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  )
}
