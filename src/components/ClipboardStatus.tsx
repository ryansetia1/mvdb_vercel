import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { getClipboardStatus, copyToClipboard } from '../utils/clipboard'
import { CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react'

export function ClipboardStatus() {
  const [status, setStatus] = useState(getClipboardStatus())
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    setStatus(getClipboardStatus())
  }, [])

  const handleTestCopy = async () => {
    const testText = 'Clipboard test successful!'
    const success = await copyToClipboard(testText, 'Test')
    setTestResult(success ? 'success' : 'failed')
    
    // Clear test result after 3 seconds
    setTimeout(() => setTestResult(null), 3000)
  }

  const getStatusIcon = () => {
    if (status.supported) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = () => {
    if (status.method === 'modern') {
      return <Badge variant="default" className="text-xs">Modern API</Badge>
    } else if (status.method === 'legacy') {
      return <Badge variant="secondary" className="text-xs">Legacy Support</Badge>
    } else {
      return <Badge variant="destructive" className="text-xs">Not Supported</Badge>
    }
  }

  const getSecureContextBadge = () => {
    if (status.secureContext) {
      return <Badge variant="outline" className="text-xs text-green-600">Secure Context</Badge>
    } else {
      return <Badge variant="outline" className="text-xs text-orange-600">Insecure Context</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getStatusIcon()}
          Clipboard Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {getStatusBadge()}
          {getSecureContextBadge()}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {status.supported ? (
            <>
              Clipboard operations are supported using {status.method === 'modern' ? 'modern Clipboard API' : 'legacy execCommand'}.
              {!status.secureContext && (
                <div className="flex items-start gap-2 mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">
                    Modern Clipboard API requires HTTPS or localhost for full functionality.
                  </span>
                </div>
              )}
            </>
          ) : (
            'Clipboard operations are not supported in this environment.'
          )}
        </div>

        <Button
          onClick={handleTestCopy}
          size="sm"
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Test Copy Function
        </Button>

        {testResult && (
          <div className={`text-sm p-2 rounded ${
            testResult === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            Copy test {testResult === 'success' ? 'passed' : 'failed'}!
          </div>
        )}
      </CardContent>
    </Card>
  )
}