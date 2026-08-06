import { LucideIcon, Users, Clock, Calendar, CheckSquare, Megaphone, Bell, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="bg-gray-50 p-4 rounded-full mb-4">
        <Icon className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function NoEmployees({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No employees found"
      description="Get started by adding your first team member to the system."
      action={onAdd ? { label: "Add Employee", onClick: onAdd } : undefined}
    />
  )
}

export function NoAttendance() {
  return (
    <EmptyState
      icon={Clock}
      title="No attendance records"
      description="There are no attendance logs available for this period."
    />
  )
}

export function NoLeaves({ onApply }: { onApply?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No leave requests"
      description="You haven't submitted any leave requests yet."
      action={onApply ? { label: "Apply for Leave", onClick: onApply } : undefined}
    />
  )
}

export function NoTasks({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks assigned"
      description="You are all caught up! There are no pending tasks right now."
      action={onAdd ? { label: "Create Task", onClick: onAdd } : undefined}
    />
  )
}

export function NoAnnouncements() {
  return (
    <EmptyState
      icon={Megaphone}
      title="No announcements"
      description="There are no company announcements at the moment."
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You don't have any new notifications."
    />
  )
}

export function NoReports() {
  return (
    <EmptyState
      icon={FileText}
      title="No reports available"
      description="Generate your first report to see insights and data here."
    />
  )
}
