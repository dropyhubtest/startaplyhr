import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-indigo-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              <Home className="w-4 h-4" />
              Go to Home
            </button>
          </Link>
        </div>
        
        <p className="text-sm text-gray-400 mt-8 font-medium">
          Startaply HR Portal
        </p>
      </div>
    </div>
  )
}
