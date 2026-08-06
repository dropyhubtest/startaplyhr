"use client"

import { MessageSquare } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

interface TaskCardProps {
  task: any
  onClick: () => void
  onStatusChange?: (taskId: string, status: string) => void
}

export function TaskCard({ task, onClick, onStatusChange }: TaskCardProps) {
  const priorityConfig: Record<string, { bg: string, text: string, dot: string, label: string }> = {
    HIGH: { 
      bg: "bg-red-100", 
      text: "text-red-700",
      dot: "bg-red-500",
      label: "High"
    },
    MEDIUM: { 
      bg: "bg-yellow-100", 
      text: "text-yellow-700",
      dot: "bg-yellow-500",
      label: "Medium"
    },
    LOW: { 
      bg: "bg-green-100", 
      text: "text-green-700",
      dot: "bg-green-500",
      label: "Low"
    },
  }

  const isOverdue = task.deadline && 
    new Date(task.deadline) < new Date() &&
    task.status !== "COMPLETED"

  const pConfig = priorityConfig[task.priority] || priorityConfig.MEDIUM

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-150 group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
          pConfig.bg,
          pConfig.text
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", pConfig.dot)} />
          {pConfig.label}
        </span>
        
        {task.deadline && (
          <span className={cn(
            "text-[10px] flex items-center gap-1",
            isOverdue ? "text-red-600 font-medium" : "text-gray-400"
          )}>
            {isOverdue && "⚠️ "}
            {new Date(task.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })}
          </span>
        )}
      </div>
      
      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-700 leading-tight">
        {task.title}
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-indigo-700">
              {getInitials(task.assignedTo?.name || "?")}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {task.assignedTo?.name.split(" ")[0] || "Unknown"}
          </span>
        </div>
        
        {(task._count?.comments || 0) > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {task._count.comments}
          </span>
        )}
      </div>
      
      {isOverdue && (
        <div className="mt-2 text-[10px] font-medium text-red-600 bg-red-50 rounded px-2 py-1">
          Overdue by {Math.floor((Date.now() - new Date(task.deadline).getTime()) / 86400000)} day(s)
        </div>
      )}

      {onStatusChange && (
        <div className="mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <select 
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="w-full text-xs border-gray-200 rounded p-1"
          >
            <option value="TODO">To Do</option>
            <option value="INPROGRESS">In Progress</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="BLOCKED">🚫 Blocked</option>
          </select>
        </div>
      )}
    </div>
  )
}
