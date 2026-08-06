"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock, Loader2, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChangePasswordPage() {
  const { user, updateSession } = useAuth()
  const router = useRouter()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Password strength logic
  const getStrength = (pass: string) => {
    let score = 0
    if (pass.length > 0) score += 1
    if (pass.length >= 8) score += 1
    if (pass.length >= 12) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    
    // Max score is 6, map to 0-4
    return Math.min(4, Math.floor(score * 4 / 6))
  }
  
  const strength = getStrength(newPassword)
  const strengthText = ["Too Weak", "Weak", "Fair", "Good", "Strong"][strength] || ""
  const strengthColor = [
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-600"
  ][strength] || "bg-gray-200"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/first-login-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Password updated successfully!")
        
        // Force session token refresh — this triggers the jwt callback
        // with trigger="update", which re-reads isFirstLogin from DB
        await updateSession({ isFirstLogin: false })
        
        // Small delay to ensure the session cookie propagates
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use router.replace to avoid back-button issues, then hard reload
        // to ensure middleware reads the fresh JWT cookie
        const redirectTo = user?.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard"
        window.location.href = redirectTo
      } else {
        toast.error(data.error || "Failed to update password")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Welcome to Startaply!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          For your security, please change your default password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Create a secure password</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Use at least 8 characters. We recommend a mix of uppercase, lowercase, numbers, and symbols.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter new password"
                />
              </div>
              
              {newPassword.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Password strength</span>
                    <span className={cn("text-xs font-bold", newPassword.length < 8 ? "text-red-500" : "text-gray-700")}>
                      {strengthText}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[0, 1, 2, 3, 4].map(idx => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex-1 rounded-full transition-colors duration-300",
                          idx <= strength && newPassword.length >= 8 ? strengthColor : 
                          idx === 0 && newPassword.length > 0 ? "bg-red-500" : "bg-gray-100"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Confirm new password"
                />
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="mt-2 text-xs text-red-600 font-medium">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-md h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
