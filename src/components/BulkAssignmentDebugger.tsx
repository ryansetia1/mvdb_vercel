import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { toast } from 'sonner@2.0.3'
import { movieApi } from '../utils/movieApi'
import { bulkAssignmentApi } from '../utils/bulkAssignmentApi'
import { Bug, TestTube, Database, Server } from 'lucide-react'

interface BulkAssignmentDebuggerProps {
  accessToken: string
}

export function BulkAssignmentDebugger({ accessToken }: BulkAssignmentDebuggerProps) {
  const [testMovieId, setTestMovieId] = useState('')
  const [testTagName, setTestTagName] = useState('')
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugResults, setDebugResults] = useState<any[]>([])

  const addDebugLog = (log: any) => {
    setDebugResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      ...log
    }])
  }

  const clearLogs = () => {
    setDebugResults([])
  }

  const debugBulkAssignment = async () => {
    if (!testMovieId.trim() || !testTagName.trim()) {
      toast.error('Please enter both movie ID and tag name')
      return
    }

    try {
      setIsDebugging(true)
      clearLogs()
      
      addDebugLog({
        step: 'START',
        message: 'Starting bulk assignment debug test',
        data: { testMovieId, testTagName }
      })

      // Step 1: Check if movie exists
      addDebugLog({
        step: 'STEP_1',
        message: 'Fetching movie before assignment'
      })
      
      const movieBefore = await movieApi.getMovie(testMovieId)
      addDebugLog({
        step: 'STEP_1_RESULT',
        message: 'Movie data before assignment',
        data: {
          movieId: movieBefore.id,
          currentTags: movieBefore.tags,
          titleEn: movieBefore.titleEn,
          titleJp: movieBefore.titleJp
        }
      })

      // Step 2: Perform bulk assignment
      addDebugLog({
        step: 'STEP_2',
        message: 'Performing bulk assignment'
      })

      const assignmentRequest = {
        movieIds: [testMovieId],
        metadataType: 'tag' as const,
        metadataValue: testTagName
      }

      const assignmentResult = await bulkAssignmentApi.assignMetadata(assignmentRequest, accessToken)
      addDebugLog({
        step: 'STEP_2_RESULT',
        message: 'Bulk assignment result',
        data: assignmentResult
      })

      // Step 3: Check movie after assignment
      addDebugLog({
        step: 'STEP_3',
        message: 'Fetching movie after assignment (immediate)'
      })

      const movieAfterImmediate = await movieApi.getMovie(testMovieId)
      addDebugLog({
        step: 'STEP_3_RESULT',
        message: 'Movie data after assignment (immediate)',
        data: {
          movieId: movieAfterImmediate.id,
          currentTags: movieAfterImmediate.tags,
          tagsChanged: movieBefore.tags !== movieAfterImmediate.tags,
          expectedTag: testTagName,
          tagFound: movieAfterImmediate.tags?.includes(testTagName)
        }
      })

      // Step 4: Wait a bit and check again
      addDebugLog({
        step: 'STEP_4',
        message: 'Waiting 2 seconds and checking again...'
      })

      await new Promise(resolve => setTimeout(resolve, 2000))

      const movieAfterDelay = await movieApi.getMovie(testMovieId)
      addDebugLog({
        step: 'STEP_4_RESULT',
        message: 'Movie data after assignment (2 second delay)',
        data: {
          movieId: movieAfterDelay.id,
          currentTags: movieAfterDelay.tags,
          tagsChanged: movieBefore.tags !== movieAfterDelay.tags,
          expectedTag: testTagName,
          tagFound: movieAfterDelay.tags?.includes(testTagName)
        }
      })

      // Step 5: Check all movies to see if assignment worked
      addDebugLog({
        step: 'STEP_5',
        message: 'Fetching all movies to verify persistence'
      })

      const allMovies = await movieApi.getAllMovies()
      const targetMovie = allMovies.find(m => m.id === testMovieId)
      
      addDebugLog({
        step: 'STEP_5_RESULT',
        message: 'Movie data from getAllMovies()',
        data: {
          movieFound: !!targetMovie,
          movieId: targetMovie?.id,
          currentTags: targetMovie?.tags,
          expectedTag: testTagName,
          tagFound: targetMovie?.tags?.includes(testTagName),
          totalMoviesInSystem: allMovies.length
        }
      })

      // Final summary
      const success = targetMovie?.tags?.includes(testTagName)
      addDebugLog({
        step: 'SUMMARY',
        message: success ? 'BULK ASSIGNMENT SUCCESS' : 'BULK ASSIGNMENT FAILED',
        data: {
          success,
          originalTags: movieBefore.tags,
          finalTags: targetMovie?.tags,
          tagAdded: testTagName,
          serverReportedSuccess: assignmentResult.success,
          serverUpdatedCount: assignmentResult.updatedCount
        }
      })

      if (success) {
        toast.success('Debug test completed successfully - tag was added!')
      } else {
        toast.error('Debug test failed - tag was not persisted to database')
      }

    } catch (error) {
      console.error('Debug test error:', error)
      addDebugLog({
        step: 'ERROR',
        message: 'Debug test encountered an error',
        data: {
          error: error.message || error,
          stack: error.stack
        }
      })
      toast.error(`Debug test failed: ${error.message || error}`)
    } finally {
      setIsDebugging(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Bulk Assignment Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Test Movie ID</Label>
            <Input
              value={testMovieId}
              onChange={(e) => setTestMovieId(e.target.value)}
              placeholder="Enter movie ID to test with..."
            />
          </div>
          <div>
            <Label>Test Tag Name</Label>
            <Input
              value={testTagName}
              onChange={(e) => setTestTagName(e.target.value)}
              placeholder="Enter tag name to assign..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={debugBulkAssignment}
            disabled={isDebugging || !testMovieId.trim() || !testTagName.trim()}
            className="flex items-center gap-2"
          >
            {isDebugging ? (
              <>
                <TestTube className="h-4 w-4 animate-spin" />
                Running Debug Test...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                Run Debug Test
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={clearLogs}
            disabled={isDebugging}
          >
            Clear Logs
          </Button>
        </div>

        {debugResults.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Debug Results ({debugResults.length} logs)
              </h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {debugResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border text-sm ${
                      result.step === 'ERROR' ? 'bg-destructive/10 border-destructive/20' :
                      result.step === 'SUMMARY' && result.data?.success ? 'bg-green-50 border-green-200' :
                      result.step === 'SUMMARY' ? 'bg-red-50 border-red-200' :
                      'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {result.step}: {result.message}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {result.data && (
                      <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}