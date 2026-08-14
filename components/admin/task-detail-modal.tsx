"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { 
  CalendarDays, Trash2, Send, Loader2, MessageSquare, 
  AlertTriangle, CheckCircle2 
} from "lucide-react"
import { cn, formatDate, getInitials, timeAgo } from "@/lib/utils"

interface TaskDetailModalProps {
  taskId: string | null
  onClose: () => void
  onUpdate: (task: any) => void
  onDelete?: (taskId: string) => void
}

import { ConfirmModal } from "@/components/ui-v2/confirm-modal"

export function TaskDetailModal({ taskId, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [isCommenting, setIsCommenting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId)
    } else {
      setTask(null)
    }
  }, [taskId])

  // Auto-scroll to bottom when new comment is added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [task?.comments])

  const fetchTask = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data.task)
      } else {
        toast.error("Failed to load task")
        onClose()
      }
    } catch (e) {
      toast.error("Failed to load task")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        const data = await res.json()
        setTask(data.task)
        onUpdate(data.task)
        toast.success("Status updated")
      } else {
        toast.error("Failed to update status")
      }
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async () => {
    if (!isAdmin || !onDelete) return
    
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Task deleted")
        onDelete(task.id)
        setShowDeleteConfirm(false)
        onClose()
      } else {
        toast.error("Failed to delete task")
      }
    } catch (e) {
      toast.error("Failed to delete task")
    }
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    setIsCommenting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText })
      })
      if (res.ok) {
        const data = await res.json()
        setTask((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
          _count: { comments: (prev._count?.comments || 0) + 1 }
        }))
        setCommentText("")
        onUpdate(task) // trigger board refresh
      }
    } catch (e) {
      toast.error("Failed to post comment")
    } finally {
      setIsCommenting(false)
    }
  }

  if (!taskId) return null

  const isOverdue = task?.deadline && 
    new Date(task.deadline) < new Date() &&
    task?.status !== "COMPLETED"

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 h-[85vh] flex flex-col overflow-hidden bg-gray-50 gap-0">
        {loading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Header / Meta */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Task Details
                    </span>
                    {isOverdue && (
                      <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {task.title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={cn(
                      "w-[140px] h-9 text-xs font-semibold uppercase tracking-wider",
                      task.status === "TODO" && "bg-gray-100 text-gray-700 border-gray-200",
                      task.status === "INPROGRESS" && "bg-blue-100 text-blue-700 border-blue-200",
                      task.status === "COMPLETED" && "bg-green-100 text-green-700 border-green-200",
                      task.status === "BLOCKED" && "bg-red-100 text-red-700 border-red-200",
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="INPROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>

                  {isAdmin && onDelete && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Task</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Assignee</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-indigo-700">{getInitials(task.assignedTo.name)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{task.assignedTo.name}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Priority</span>
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-bold",
                    task.priority === "HIGH" && "bg-red-100 text-red-700",
                    task.priority === "MEDIUM" && "bg-yellow-100 text-yellow-700",
                    task.priority === "LOW" && "bg-green-100 text-green-700",
                  )}>
                    {task.priority}
                  </span>
                </div>

                {task.deadline && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Deadline</span>
                    <span className={cn(
                      "text-sm font-medium flex items-center gap-1.5",
                      isOverdue ? "text-red-600" : "text-gray-700"
                    )}>
                      <CalendarDays className="w-4 h-4" />
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b pb-2">Description</h4>
                  <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {task.description || <span className="italic text-gray-400">No description provided.</span>}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Discussion ({task.comments?.length || 0})
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {task.comments?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No comments yet</p>
                      </div>
                    ) : (
                      task.comments?.map((comment: any) => {
                        const isMe = comment.userId === session?.user?.id
                        return (
                          <div key={comment.id} className={cn(
                            "flex gap-3 max-w-[85%]",
                            isMe ? "ml-auto flex-row-reverse" : ""
                          )}>
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-gray-600">{getInitials(comment.user.name)}</span>
                            </div>
                            <div className={cn(
                              "flex flex-col",
                              isMe ? "items-end" : "items-start"
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold text-gray-500">{isMe ? "You" : comment.user.name}</span>
                                <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                              </div>
                              <div className={cn(
                                "px-3 py-2 rounded-2xl text-sm",
                                isMe 
                                  ? "bg-indigo-600 text-white rounded-tr-sm" 
                                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
                              )}>
                                {comment.comment}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Comment Input */}
                  <div className="p-3 bg-white border-t border-gray-200">
                    <div className="relative">
                      <Textarea 
                        placeholder="Type a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="pr-12 resize-none min-h-[60px] bg-gray-50 border-gray-200 focus-visible:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            submitComment()
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={submitComment}
                        disabled={isCommenting || !commentText.trim()}
                      >
                        {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 pl-1">Press Enter to send, Shift+Enter for new line</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task?"
        description="Are you sure you want to permanently delete this task?"
        confirmText="Delete Task"
        variant="destructive"
        loading={deleting}
      />
    </Dialog>
  )
}
