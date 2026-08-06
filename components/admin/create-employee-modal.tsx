"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, CheckCircle, Copy, Eye, EyeOff } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 chars"),
  email: z.string().email("Please enter a valid email address with @"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits").optional().or(z.literal('')),
  jobTitle: z.string().min(2, "Job title is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  salary: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CreateEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateEmployeeModal({ open, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<{ employeeId: string; email: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: ""
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to create employee")
      }
      
      setCredentials(result.credentials)
      setShowCredentials(true)
      reset()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = () => {
    setShowCredentials(false)
    setCredentials(null)
    onSuccess()
    onClose()
  }

  const handleCopyCredentials = () => {
    if (credentials) {
      const text = `Employee ID: ${credentials.employeeId}\nEmail: ${credentials.email}`
      navigator.clipboard.writeText(text)
      toast.success("Credentials copied!")
    }
  }

  return (
    <>
      <Dialog open={open && !showCredentials} onOpenChange={onClose}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-2xl">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-800">Add New Employee</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1.5 text-sm">
                Fill in the details below to onboard a new team member.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input 
                  {...register("name")} 
                  placeholder="John Doe" 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
                {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input 
                  type="email" 
                  {...register("email")} 
                  placeholder="john@startaply.com" 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
                {errors.email && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-1.5 col-span-2 sm:col-span-1 relative">
                <Label className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    {...register("password")} 
                    placeholder="Enter password" 
                    className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
                <Input 
                  {...register("phone")} 
                  placeholder="1234567890" 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
                {errors.phone && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Job Title</Label>
                <Input 
                  {...register("jobTitle")} 
                  placeholder="Software Engineer" 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
                {errors.jobTitle && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.jobTitle.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Date of Joining</Label>
                <Input 
                  type="date" 
                  {...register("dateOfJoining")} 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
                {errors.dateOfJoining && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.dateOfJoining.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-sm font-medium text-slate-700">Salary (optional)</Label>
                <Input 
                  type="number" 
                  {...register("salary")} 
                  placeholder="e.g. 60000" 
                  className="bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <DialogFooter className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="bg-white shadow-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCredentials} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-2xl">
          <div className="p-6">
            <DialogHeader>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner shadow-emerald-200/50">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-center text-xl font-semibold text-slate-800">
                Employee Created!
              </DialogTitle>
              <DialogDescription className="text-center text-slate-500 mt-2">
                The new employee profile has been successfully created and added to the system.
              </DialogDescription>
            </DialogHeader>

            {credentials && (
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 mt-6 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Employee Details
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Employee ID</span>
                    <span className="font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">{credentials.employeeId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-medium text-slate-900">{credentials.email}</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-5 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors text-slate-600" 
                  onClick={handleCopyCredentials}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Details
                </Button>
              </div>
            )}

            <Button 
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all" 
              onClick={handleDone}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
