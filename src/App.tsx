import { useState, useEffect } from 'react'
import { LoginForm } from './components/LoginForm'
import { UnifiedApp } from './components/UnifiedApp'
import { MainContentContainer } from './components/MainContentContainer'
import { RightCroppingTest } from './components/RightCroppingTest'
import { ServerConnectionTest } from './components/ServerConnectionTest'
import { SimpleFavoritesProvider } from './contexts/SimpleFavoritesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { auth } from './utils/auth'
import { toast } from 'sonner@2.0.3'

interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
  }
  [key: string]: unknown
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        const { session } = await auth.getSession()
        if (session?.access_token) {
          setAccessToken(session.access_token)
          setUser(session.user as User)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Session check failed:', error)
        // Session check failed - user needs to login
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Set up auth state change listener for automatic token refresh
  useEffect(() => {
    const { data: { subscription } } = auth.client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.access_token ? 'token present' : 'no token')
        
        if (event === 'SIGNED_OUT' || !session) {
          setAccessToken(null)
          setUser(null)
          setIsAuthenticated(false)
        } else if (session?.access_token) {
          setAccessToken(session.access_token)
          setUser(session.user as User)
          setIsAuthenticated(true)
          
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully')
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Global error handler for authentication issues
  useEffect(() => {
    const handleAuthError = (error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('JWT')) {
        console.error('Authentication error detected:', error)
        toast.error('Session expired. Please log in again.')
        handleLogout()
      }
    }

    // Listen for unhandled promise rejections that might be auth errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('401') || event.reason?.message?.includes('JWT')) {
        handleAuthError(event.reason)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Global image error handler to suppress console noise
  useEffect(() => {
    const handleImageError = (event: Event) => {
      const target = event.target as HTMLImageElement
      if (target && target.tagName === 'IMG') {
        // Silently handle image errors to prevent console noise
        // The ImageWithFallback component will handle the UI fallback
        event.preventDefault()
        event.stopPropagation()
      }
    }

    // Add global error listener for images
    document.addEventListener('error', handleImageError, true)
    
    return () => {
      document.removeEventListener('error', handleImageError, true)
    }
  }, [])

  const handleLoginSuccess = (token: string, userData: User) => {
    setAccessToken(token)
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with local logout even if server logout fails
    }
    
    setAccessToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading Movie Database...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <ThemeProvider>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <SimpleFavoritesProvider accessToken={accessToken}>
        <div className="min-h-screen bg-background">
          <MainContentContainer>
            <UnifiedApp
              accessToken={accessToken}
              user={user}
              onLogout={handleLogout}
            />
          </MainContentContainer>
        </div>
      </SimpleFavoritesProvider>
    </ThemeProvider>
  )
}

export default App