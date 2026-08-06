"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const schema = z.object({
  loginTime: z.string().optional(),
  logoutTime: z.string().optional(),
  status: z.enum(["PRESENT", "LATE", "HALFDAY", "ABSENT", "LEAVE"]),
  adminNote: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AttendanceCorrectionModalProps {
  open: boolean
  log: any | null
  onClose: () => void
  onSuccess: () => void
}

export function AttendanceCorrectionModal({ open, log, onClose, onSuccess }: AttendanceCorrectionModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (log) {
      // Convert Date object/string to "HH:mm" for time input
      const formatTimeInput = (dateStr: string | null) => {
        if (!dateStr) return ""
        const d = new Date(dateStr)
        return d.toTimeString().slice(0, 5)
      }

      reset({
        loginTime: formatTimeInput(log.loginTime),
        logoutTime: formatTimeInput(log.logoutTime),
        status: log.status,
        adminNote: log.adminNote || "",
      })
      setValue("status", log.status)
    }
  }, [log, reset, setValue])

  const onSubmit = async (data: FormValues) => {
    if (!log) return
    setIsLoading(true)
    
    try {
      // Reconstruct full Date string combining log.date and input time
      const logDate = new Date(log.date)
      const dateStr = logDate.toISOString().split("T")[0] // YYYY-MM-DD
      
      let finalLoginTime = null
      if (data.loginTime) {
        finalLoginTime = new Date(`${dateStr}T${data.loginTime}:00`).toISOString()
      }
      
      let finalLogoutTime = null
      if (data.logoutTime) {
        finalLogoutTime = new Date(`${dateStr}T${data.logoutTime}:00`).toISOString()
      }

      const res = await fetch(`/api/attendance/${log.id}/correct`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginTime: finalLoginTime,
          logoutTime: finalLogoutTime,
          status: data.status,
          adminNote: data.adminNote,
        }),
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      
      toast.success("Attendance corrected successfully")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Correct Attendance</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-3 rounded-lg flex justify-between border border-gray-200 text-sm mb-2">
          <div>
            <p className="text-gray-500 text-xs">Employee</p>
            <p className="font-medium text-gray-900">{log.user?.name || log.name}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Date</p>
            <p className="font-medium text-gray-900">{new Date(log.date || log.log?.date).toLocaleDateString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Login Time</Label>
              <Input type="time" {...register("loginTime")} />
            </div>
            <div className="space-y-1">
              <Label>Logout Time</Label>
              <Input type="time" {...register("logoutTime")} />
              <p className="text-[10px] text-gray-400">Leave empty if missing</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select defaultValue={log.status} onValueChange={(v: any) => setValue("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="HALFDAY">Half Day</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Admin Note (Optional)</Label>
            <Textarea {...register("adminNote")} placeholder="Reason for correction..." rows={2} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Correction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
