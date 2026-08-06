// User & Auth Types
export type Role = "ADMIN" | "EMPLOYEE"

export interface User {
  id: string
  employeeId: string
  name: string
  email: string
  role: Role
  department: string
  jobTitle: string
  phone?: string
  profilePhoto?: string
  salary?: number
  dateOfJoining: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Attendance Types
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALFDAY" | "LEAVE" | "LATE" | "WEEKEND"
export type EmployeeWorkStatus = "NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED" | "ABSENT"

export interface AttendanceLog {
  id: string
  userId: string
  user?: User
  date: Date
  loginTime?: Date
  logoutTime?: Date
  totalWorkMinutes: number
  totalBreakMinutes: number
  netWorkMinutes: number
  status: AttendanceStatus
  isLate: boolean
  overtimeMinutes: number
  breaks?: BreakLog[]
  createdAt: Date
}

export interface BreakLog {
  id: string
  attendanceLogId: string
  userId: string
  breakStart: Date
  breakEnd?: Date
  breakDurationMinutes?: number
  createdAt: Date
}

// Leave Types
export type LeaveType = "SICK" | "CASUAL" | "PAID" | "WFH" | "EMERGENCY"
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

export interface Leave {
  id: string
  userId: string
  user?: User
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  totalDays: number
  reason: string
  status: LeaveStatus
  adminComment?: string
  approvedBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface LeaveBalance {
  id: string
  userId: string
  year: number
  sickLeave: number
  casualLeave: number
  paidLeave: number
  wfhLeave: number
  usedSick: number
  usedCasual: number
  usedPaid: number
  usedWFH: number
}

// Task Types
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW"
export type TaskStatus = "TODO" | "INPROGRESS" | "COMPLETED" | "BLOCKED"

export interface Task {
  id: string
  title: string
  description?: string
  assignedTo: string
  assignedToUser?: User
  assignedBy: string
  assignedByUser?: User
  priority: TaskPriority
  status: TaskStatus
  deadline?: Date
  comments?: TaskComment[]
  createdAt: Date
  updatedAt: Date
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  user?: User
  comment: string
  createdAt: Date
}

// Notification Types
export type NotificationType =
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "TASK_ASSIGNED"
  | "ANNOUNCEMENT"
  | "ATTENDANCE_ALERT"
  | "GENERAL"

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  isRead: boolean
  type: NotificationType
  createdAt: Date
}

// Announcement Types
export interface Announcement {
  id: string
  title: string
  content: string
  createdBy: string
  createdByUser?: User
  isUrgent: boolean
  targetAll: boolean
  createdAt: Date
}

// Settings Types
export interface CompanySettings {
  id: string
  companyName: string
  workStartTime: string
  workEndTime: string
  lateThresholdMinutes: number
  maxBreakMinutes: number
  overtimeAfterMinutes: number
  defaultSickLeave: number
  defaultCasualLeave: number
  defaultPaidLeave: number
  defaultWFHLeave: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard Stats Types
export interface AdminDashboardStats {
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  onBreakNow: number
  absentToday: number
  onLeaveToday: number
  pendingLeaveRequests: number
  tasksDueToday: number
}

export interface LiveEmployeeStatus {
  userId: string
  name: string
  avatar?: string
  department: string
  status: EmployeeWorkStatus
  loginTime?: Date
  breakStartTime?: Date
  hoursWorkedToday: number
  breakTimeToday: number
}
