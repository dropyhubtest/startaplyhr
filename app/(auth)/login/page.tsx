"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  ShieldCheck,
} from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Warm up routes in background while user fills login form
    router.prefetch("/admin/dashboard")
    router.prefetch("/employee/dashboard")
    router.prefetch("/employee/attendance")
    router.prefetch("/employee/tasks")
    router.prefetch("/employee/leaves")
    router.prefetch("/employee/profile")
    router.prefetch("/admin/employees")
    router.prefetch("/admin/attendance")
  }, [router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError("")

    // Initiate background warm-up requests for fast load
    fetch("/api/admin/dashboard/stats").catch(() => {})
    fetch("/api/admin/dashboard/live-status").catch(() => {})
    fetch("/api/announcements?limit=3").catch(() => {})
    fetch("/api/tasks").catch(() => {})
    fetch("/api/leaves").catch(() => {})

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please try again.")
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        const session = await getSession()
        const user = session?.user as any

        if (user?.isFirstLogin) {
          router.push("/change-password")
          return
        }

        if (user?.role === "ADMIN") {
          router.push("/admin/dashboard")
        } else {
          router.push("/employee/dashboard")
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      {/* Login Form Container */}
      <div suppressHydrationWarning className="w-full max-w-md flex flex-col bg-white sm:rounded-2xl sm:shadow-xl sm:border sm:border-slate-100 overflow-hidden">
        
        {/* Logo (top) */}
        <div className="flex justify-center pt-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl 
              bg-gradient-to-br from-indigo-600 to-purple-600 
              flex items-center justify-center shadow-md">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <span className="font-bold text-2xl 
              tracking-tight text-slate-900">
              Startaply
            </span>
          </div>
        </div>
        
        {/* Form container */}
        <div className="flex-1 flex items-center justify-center 
          px-6 py-8">
          <div className="w-full max-w-sm">
            
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 
                tracking-tight mb-2">
                Sign in to your account
              </h2>
              <p className="text-slate-500 text-sm">
                Enter your credentials to access the portal
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="mb-5 p-3 rounded-lg 
                bg-red-50 border border-red-100 
                flex items-start gap-2.5 animate-in fade-in 
                slide-in-from-top-1 duration-200">
                <div className="w-4 h-4 rounded-full bg-red-500 
                  flex items-center justify-center flex-shrink-0 
                  mt-0.5">
                  <span className="text-white text-[10px] 
                    font-bold">!</span>
                </div>
                <p className="text-sm text-red-700 
                  leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} 
              suppressHydrationWarning
              className="space-y-4">
              
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium 
                  text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 
                    -translate-y-1/2 w-4 h-4 text-slate-400 
                    pointer-events-none" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    suppressHydrationWarning
                    className={`w-full h-11 pl-10 pr-3 
                      rounded-lg border bg-white text-sm 
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 
                      focus:ring-indigo-500/20 
                      focus:border-indigo-500
                      transition-all duration-150
                      ${errors.email 
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                        : "border-slate-200"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 
                    flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium 
                    text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="text-xs font-medium 
                      text-indigo-600 hover:text-indigo-700
                      transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 
                    -translate-y-1/2 w-4 h-4 text-slate-400 
                    pointer-events-none" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    suppressHydrationWarning
                    className={`w-full h-11 pl-10 pr-10 
                      rounded-lg border bg-white text-sm 
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 
                      focus:ring-indigo-500/20 
                      focus:border-indigo-500
                      transition-all duration-150
                      ${errors.password 
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                        : "border-slate-200"
                      }`}
                  />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 
                      -translate-y-1/2 text-slate-400 
                      hover:text-slate-600 transition-colors
                      p-0.5 rounded"
                    tabIndex={-1}
                  >
                    {showPassword 
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 
                  cursor-pointer group">
                  <input
                    type="checkbox"
                    suppressHydrationWarning
                    className="w-4 h-4 rounded border-slate-300 
                      text-indigo-600 focus:ring-2 
                      focus:ring-indigo-500/20 
                      focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 
                    group-hover:text-slate-900 
                    transition-colors select-none">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                suppressHydrationWarning
                disabled={isLoading}
                className="w-full h-11 rounded-lg 
                  bg-slate-900 hover:bg-slate-800 
                  text-white text-sm font-medium
                  flex items-center justify-center gap-2
                  transition-all duration-150
                  disabled:opacity-70 disabled:cursor-not-allowed
                  shadow-sm hover:shadow-md
                  active:scale-[0.98]
                  mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security notice */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center 
                gap-2 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <p className="text-xs">
                  Secured with enterprise-grade encryption
                </p>
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-8">
          <div className="flex items-center justify-between 
            text-xs text-slate-400">
            <p>© 2024 Startaply Inc.</p>
            <div className="flex items-center gap-4">
              <button className="hover:text-slate-600 
                transition-colors">
                Privacy
              </button>
              <button className="hover:text-slate-600 
                transition-colors">
                Terms
              </button>
              <button className="hover:text-slate-600 
                transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
