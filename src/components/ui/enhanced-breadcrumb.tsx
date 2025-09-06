import { ChevronRight, Home } from 'lucide-react'
import { cn } from './utils'
import { Button } from './button'

interface BreadcrumbItem {
  id: string
  label: string
  onClick?: () => void
  isActive?: boolean
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  onHomeClick?: () => void
}

export function EnhancedBreadcrumb({ 
  items, 
  className, 
  showHome = true, 
  onHomeClick 
}: EnhancedBreadcrumbProps) {
  if (items.length === 0 && !showHome) return null

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {showHome && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHomeClick}
            className="px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Button>
          {items.length > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </>
      )}
      
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          
          {item.onClick && !item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className="px-2 py-1 h-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Button>
          ) : (
            <span className={cn(
              "px-2 py-1",
              item.isActive 
                ? "text-foreground font-medium" 
                : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}