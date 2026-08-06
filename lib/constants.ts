export const APP_NAME = "Startaply HR"

export const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "Design",
  "HR",
  "Operations",
  "Finance",
  "Customer Support",
]

export const LEAVE_TYPES = {
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  PAID: "Paid Leave",
  WFH: "Work From Home",
  EMERGENCY: "Emergency Leave",
}

export const TASK_PRIORITIES = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

export const TASK_STATUSES = {
  TODO: "To Do",
  INPROGRESS: "In Progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
}

export const ATTENDANCE_STATUSES = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALFDAY: "Half Day",
  LEAVE: "On Leave",
  LATE: "Late",
  WEEKEND: "Weekend",
}

export const WORK_START_TIME = "09:00"
export const WORK_END_TIME = "18:00"
export const LATE_THRESHOLD_MINUTES = 30
export const MAX_BREAK_MINUTES = 60
export const OVERTIME_AFTER_MINUTES = 540

export const DEFAULT_LEAVE_QUOTA = {
  SICK: 10,
  CASUAL: 12,
  PAID: 15,
  WFH: 24,
}

export const COLORS = {
  primary: "#6366F1",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  gray: "#6B7280",
}

export const STATUS_COLORS: Record<string, string> = {
  ONLINE: "bg-green-100 text-green-800",
  ON_BREAK: "bg-yellow-100 text-yellow-800",
  OFFLINE: "bg-gray-100 text-gray-800",
  ABSENT: "bg-red-100 text-red-800",
  ON_LEAVE: "bg-blue-100 text-blue-800",
  LATE: "bg-orange-100 text-orange-800",
  PRESENT: "bg-green-100 text-green-800",
  HALFDAY: "bg-purple-100 text-purple-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
  TODO: "bg-gray-100 text-gray-800",
  INPROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
}
