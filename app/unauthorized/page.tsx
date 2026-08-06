import Link from "next/link"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          403
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Access Denied
        </h2>
        <p className="text-gray-500 mb-8">
          You do not have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        
        <Link href="/login">
          <button className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium mx-auto transition-colors">
            Go to Login
          </button>
        </Link>
        
        <p className="text-sm text-gray-400 mt-8 font-medium">
          Startaply HR Portal
        </p>
      </div>
    </div>
  )
}
