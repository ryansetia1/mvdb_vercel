import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { favoritesApi, FavoriteItem } from '../utils/favoritesApi'
import { FavoriteButton } from './FavoriteButton'
import { toast } from 'sonner@2.0.3'
import { Trash2, RefreshCw, TestTube, CheckCircle, XCircle } from 'lucide-react'

interface FavoritesDebuggerProps {
  accessToken: string
}

export function FavoritesDebugger({ accessToken }: FavoritesDebuggerProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [lastError, setLastError] = useState<string | null>(null)

  // Test connection to server
  const testConnection = async () => {
    try {
      setIsLoading(true)
      const result = await favoritesApi.testConnection()
      if (result.success) {
        setConnectionStatus('connected')
        setLastError(null)
        toast.success('Server connection successful')
      } else {
        setConnectionStatus('error')
        setLastError(result.error || 'Unknown connection error')
        toast.error(`Server connection failed: ${result.error}`)
      }
    } catch (error) {
      setConnectionStatus('error')
      setLastError(error.message || 'Connection test failed')
      toast.error(`Connection test failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load favorites
  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      setLastError(null)
      const data = await favoritesApi.getFavorites(accessToken, true) // Force reload
      setFavorites(data)
      toast.success(`Loaded ${data.length} favorites`)
    } catch (error) {
      setLastError(error.message || 'Failed to load favorites')
      toast.error(`Failed to load favorites: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Test adding a favorite
  const testAddFavorite = async () => {
    try {
      setIsLoading(true)
      const testFavorite = {
        type: 'movie' as const,
        itemId: `test-movie-${Date.now()}`,
        metadata: {
          title: 'Test Movie',
          description: 'This is a test favorite'
        }
      }
      
      await favoritesApi.addFavorite(testFavorite, accessToken)
      toast.success('Test favorite added')
      await loadFavorites() // Reload list
    } catch (error) {
      setLastError(error.message || 'Failed to add test favorite')
      toast.error(`Failed to add test favorite: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Remove favorite
  const removeFavorite = async (favoriteId: string) => {
    try {
      setIsLoading(true)
      await favoritesApi.removeFavorite(favoriteId, accessToken)
      toast.success('Favorite removed')
      await loadFavorites() // Reload list
    } catch (error) {
      setLastError(error.message || 'Failed to remove favorite')
      toast.error(`Failed to remove favorite: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear cache
  const clearCache = () => {
    favoritesApi.clearCache()
    toast.success('Cache cleared')
  }

  useEffect(() => {
    testConnection()
    loadFavorites()
  }, [accessToken])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Favorites System Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Server Connection:</span>
            {connectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            {connectionStatus === 'unknown' && (
              <Badge variant="secondary">Unknown</Badge>
            )}
          </div>

          {/* Access Token Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Access Token:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {accessToken ? `${accessToken.slice(0, 20)}...` : 'None'}
            </Badge>
          </div>

          {/* Cache Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cache Status:</span>
            <Badge variant="outline">
              {(() => {
                const status = favoritesApi.getCacheStatus()
                return status.isCached ? `Cached (${Math.round(status.age / 1000)}s old)` : 'No Cache'
              })()}
            </Badge>
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Last Error:</strong> {lastError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testConnection}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            
            <Button
              onClick={loadFavorites}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Favorites
            </Button>
            
            <Button
              onClick={testAddFavorite}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              Add Test Favorite
            </Button>
            
            <Button
              onClick={clearCache}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              Clear Cache
            </Button>
          </div>

          {/* Favorites List */}
          <div className="space-y-2">
            <h4 className="font-medium">Current Favorites ({favorites.length})</h4>
            {favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No favorites found</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {favorite.type}
                      </Badge>
                      <span className="text-sm font-mono">
                        {favorite.itemId?.slice(0, 30)}...
                      </span>
                    </div>
                    <Button
                      onClick={() => removeFavorite(favorite.id!)}
                      disabled={isLoading}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test FavoriteButton */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Test FavoriteButton Component</h4>
            <div className="flex items-center gap-4">
              <FavoriteButton
                type="movie"
                itemId="debug-test-movie"
                metadata={{
                  title: 'Debug Test Movie',
                  description: 'This is for testing the FavoriteButton component'
                }}
                accessToken={accessToken}
                size="md"
                variant="outline"
                showText={true}
              />
              <span className="text-sm text-muted-foreground">
                Click to test the FavoriteButton component
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}