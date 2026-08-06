import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isWeekend as dateFnsIsWeekend, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { STATUS_COLORS } from "./constants"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { pusher } from "./pusher"

/**
 * Merge class names using clsx + tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date nicely
 */
export function formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, formatStr)
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "hh:mm a")
}

/**
 * Convert minutes to "2h 30m" format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return "0m"
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Calculate work hours from login/logout times minus break time
 */
export function calculateWorkHours(
  loginTime: Date,
  logoutTime: Date,
  breakMinutes: number = 0
): number {
  const diffMs = logoutTime.getTime() - loginTime.getTime()
  const totalMinutes = diffMs / (1000 * 60)
  return Math.max(0, totalMinutes - breakMinutes)
}

/**
 * Generate employee ID like EMP001, EMP002...
 */
export function generateEmployeeId(count: number): string {
  return `EMP${String(count).padStart(3, "0")}`
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

/**
 * Check if login time is late based on threshold
 */
export function isLateLogin(loginTime: Date, thresholdMinutes: number = 30): boolean {
  const workStart = new Date(loginTime)
  workStart.setHours(9, 0, 0, 0) // 9:00 AM
  const diffMinutes = (loginTime.getTime() - workStart.getTime()) / (1000 * 60)
  return diffMinutes > thresholdMinutes
}

/**
 * Calculate leave days excluding weekends
 */
export function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  return days.filter((day) => !dateFnsIsWeekend(day)).length
}

/**
 * Return Tailwind color class for a status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
}

/**
 * Truncate long text
 */
export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

/**
 * Format salary / currency (INR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get day name from date
 */
export function getDayOfWeek(date: Date): string {
  return format(date, "EEEE")
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  return dateFnsIsWeekend(date)
}

/**
 * Get the start and end dates of a month
 */
export function getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  return { start, end }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// ─── API Helpers ───────────────────────────────────────────────

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if ((session.user as any).role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }
  return session
}

export async function createAuditLog(userId: string, action: string, details?: string, ipAddress?: string) {
  return await prisma.auditLog.create({
    data: {
      userId,
      action,
      details,
      ipAddress,
    },
  })
}

export async function sendNotification(userId: string, title: string, message: string, type: any = "GENERAL") {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  })
  
  // Also trigger pusher event
  await triggerPusherEvent(`employee-${userId}`, "new-notification", notification)
  return notification
}

export async function triggerPusherEvent(channel: string, event: string, data: any) {
  try {
    await pusher.trigger(channel, event, data)
  } catch (error) {
    console.error("Pusher trigger error:", error)
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash)
}

export async function generateNewEmployeeId() {
  const lastUser = await prisma.user.findFirst({
    where: { role: "EMPLOYEE" },
    orderBy: { employeeId: "desc" },
  })

  if (!lastUser || !lastUser.employeeId) {
    return "EMP001"
  }

  const currentId = parseInt(lastUser.employeeId.replace("EMP", ""), 10)
  return `EMP${String(currentId + 1).padStart(3, "0")}`
}

export function calculateNetWorkTime(loginTime: Date, logoutTime: Date, breakMinutes: number = 0) {
  const diffMs = logoutTime.getTime() - loginTime.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  return Math.max(0, totalMinutes - breakMinutes)
}

export function determineAttendanceStatus(loginTime: Date, settings: any) {
  const [hours, minutes] = settings.workStartTime.split(":").map(Number)
  const workStart = new Date(loginTime)
  workStart.setHours(hours, minutes, 0, 0)
  
  const diffMinutes = (loginTime.getTime() - workStart.getTime()) / (1000 * 60)
  
  if (diffMinutes > settings.lateThresholdMinutes) {
    return "LATE"
  }
  return "PRESENT"
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function timeAgo(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", { 
    month: "short", day: "numeric" 
  })
}
