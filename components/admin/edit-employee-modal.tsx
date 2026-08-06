"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { DEPARTMENTS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 chars"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  salary: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EditEmployeeModalProps {
  open: boolean
  employee: any | null
  onClose: () => void
  onSuccess: () => void
}

export function EditEmployeeModal({ open, employee, onClose, onSuccess }: EditEmployeeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        phone: employee.phone || "",
        department: employee.department,
        jobTitle: employee.jobTitle,
        salary: employee.salary ? String(employee.salary) : "",
      })
      setValue("department", employee.department)
    }
  }, [employee, reset, setValue])

  const onSubmit = async (data: FormValues) => {
    if (!employee) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to update employee")
      }
      
      toast.success("Employee updated successfully")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-200 mb-2">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="text-sm font-mono font-medium text-gray-900">{employee?.employeeId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="text-sm font-medium text-gray-900">{employee?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input {...register("phone")} />
            </div>
            
            <div className="space-y-1">
              <Label>Department</Label>
              <Select defaultValue={employee?.department} onValueChange={(v) => setValue("department", v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Job Title</Label>
              <Input {...register("jobTitle")} />
              {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Salary (optional)</Label>
              <Input type="number" {...register("salary")} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
