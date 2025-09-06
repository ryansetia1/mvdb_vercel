import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { favoritesApi } from '../utils/favoritesApi'
import { projectId } from '../utils/supabase/info'

export function ServerConnectionTest() {
  const [testResults, setTestResults] = useState<{
    health: { success: boolean; error?: string }
    connection: { success: boolean; error?: string }
    timestamp: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    console.log('=== SERVER CONNECTION TEST STARTED ===')
    
    try {
      // Test 1: Health check
      console.log('Running health check...')
      const healthResult = await favoritesApi.checkHealth()
      
      // Test 2: Full connection test
      console.log('Running full connection test...')
      const connectionResult = await favoritesApi.testConnection()
      
      const results = {
        health: { success: healthResult },
        connection: connectionResult,
        timestamp: new Date().toISOString()
      }
      
      console.log('=== SERVER CONNECTION TEST RESULTS ===', results)
      setTestResults(results)
      
    } catch (error) {
      console.error('=== SERVER CONNECTION TEST FAILED ===', error)
      setTestResults({
        health: { success: false, error: error.message },
        connection: { success: false, error: error.message },
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Run test on component mount
    runTests()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Connected" : "Failed"}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Server Connection Test
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            size="sm" 
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? 'Testing...' : 'Retest'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.health.success)}
                <span>Health Check</span>
              </div>
              {getStatusBadge(testResults.health.success)}
            </div>
            
            {testResults.health.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                <strong>Health Check Error:</strong> {testResults.health.error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.connection.success)}
                <span>Full Connection</span>
              </div>
              {getStatusBadge(testResults.connection.success)}
            </div>
            
            {testResults.connection.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                <strong>Connection Error:</strong> {testResults.connection.error}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Last tested: {new Date(testResults.timestamp).toLocaleString()}
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Project ID: {projectId}</div>
              <div>Endpoint: make-server-e0516fcf</div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            {isLoading ? 'Running tests...' : 'Click Retest to check connection'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}