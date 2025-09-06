import { ReactNode } from 'react'

interface MainContentContainerProps {
  children: ReactNode
  className?: string
}

/**
 * MainContentContainer component enforces a maximum width of 1536px
 * and provides responsive behavior with proper padding.
 * 
 * - Max width: 1536px (does not stretch beyond this on larger screens)
 * - Centered horizontally with margin: 0 auto
 * - Responsive padding:
 *   - Mobile (< 768px): 16px horizontal padding
 *   - Tablet (768px - 1024px): 24px horizontal padding  
 *   - Desktop (≥ 1024px): 32px horizontal padding until max-width is reached
 */
export function MainContentContainer({ children, className = '' }: MainContentContainerProps) {
  return (
    <div className={`
      w-full
      max-w-[1536px] 
      mx-auto
      px-4
      sm:px-6
      md:px-8
      ${className}
    `}>
      {children}
    </div>
  )
}