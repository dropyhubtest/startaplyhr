import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ 
  title, description, action 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-slate-900 
            tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[13.5px] text-slate-500 
              mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>
    </div>
  )
}
