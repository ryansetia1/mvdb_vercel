import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Brain, Zap, Sparkles } from 'lucide-react'

interface AITranslationLoadingProps {
  text?: string
  type?: 'translation' | 'romaji'
  isVisible?: boolean
}

export function AITranslationLoading({ 
  text = "Menerjemahkan dengan AI...", 
  type = 'translation',
  isVisible = true 
}: AITranslationLoadingProps) {
  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'romaji':
        return <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
      case 'translation':
      default:
        return <Brain className="h-4 w-4 animate-pulse text-purple-500" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'romaji':
        return 'Konversi Romaji'
      case 'translation':
      default:
        return 'Translation'
    }
  }

  const getColor = () => {
    switch (type) {
      case 'romaji':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
      case 'translation':
      default:
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getColor()}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            {getIcon()}
            <Zap className="h-3 w-3 animate-bounce text-yellow-500" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                DeepSeek R1
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getTypeLabel()}
              </span>
            </div>
            
            <div className="text-sm font-medium text-foreground">
              {text}
            </div>
          </div>
          
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact version for inline use
export function AITranslationLoadingInline({ 
  text = "AI translating...", 
  type = 'translation',
  isVisible = true 
}: AITranslationLoadingProps) {
  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'romaji':
        return <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
      case 'translation':
      default:
        return <Brain className="h-3 w-3 animate-pulse text-purple-500" />
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {getIcon()}
      <span>{text}</span>
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}

// Spinner version for buttons
export function AITranslationSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  return (
    <div className="flex items-center gap-1">
      <Brain className={`${sizeClasses[size]} animate-pulse text-purple-500`} />
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}
