import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Button } from './button'

interface CollapsibleInfoProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: 'blue' | 'green' | 'gray' | 'yellow'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export function CollapsibleInfo({ 
  title, 
  children, 
  defaultOpen = false, 
  variant = 'blue',
  size = 'md',
  icon
}: CollapsibleInfoProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const variantClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  }

  const contentVariantClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    gray: 'text-gray-700',
    yellow: 'text-yellow-700'
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm'
  }

  return (
    <div className={`rounded-lg border ${variantClasses[variant]} ${sizeClasses[size]}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between p-0 h-auto hover:bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon || <Info className="h-4 w-4" />}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      
      {isOpen && (
        <div className={`mt-3 ${contentVariantClasses[variant]}`}>
          {children}
        </div>
      )}
    </div>
  )
}
