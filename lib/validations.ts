import { z } from "zod"

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Employee schemas  
export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  salary: z.coerce.number().positive("Salary must be positive").optional(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

// Leave schemas
export const applyLeaveSchema = z.object({
  leaveType: z.enum(["SICK", "CASUAL", "PAID", "WFH", "EMERGENCY"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
})

export const rejectLeaveSchema = z.object({
  adminComment: z.string().min(1, "Admin comment is required"),
})

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Assignee is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  deadline: z.string().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "INPROGRESS", "COMPLETED", "BLOCKED"]).optional(),
})

export const addCommentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty"),
})

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isUrgent: z.boolean().default(false),
  targetAll: z.boolean().default(true),
})

// Settings schemas
export const updateSettingsSchema = z.object({
  workStartTime: z.string().min(1, "Work start time is required"),
  workEndTime: z.string().min(1, "Work end time is required"),
  lateThresholdMinutes: z.coerce.number().min(0),
  maxBreakMinutes: z.coerce.number().min(0),
  overtimeAfterMinutes: z.coerce.number().min(0),
  defaultSickLeave: z.coerce.number().min(0),
  defaultCasualLeave: z.coerce.number().min(0),
  defaultPaidLeave: z.coerce.number().min(0),
  defaultWFHLeave: z.coerce.number().min(0),
})

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>
export type ApplyLeaveFormData = z.infer<typeof applyLeaveSchema>
export type RejectLeaveFormData = z.infer<typeof rejectLeaveSchema>
export type CreateTaskFormData = z.infer<typeof createTaskSchema>
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>
export type AddCommentFormData = z.infer<typeof addCommentSchema>
export type CreateAnnouncementFormData = z.infer<typeof createAnnouncementSchema>
export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>
