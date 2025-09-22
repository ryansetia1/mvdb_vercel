import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { translateJapaneseToEnglish, convertJapaneseToRomaji, testOpenRouterConnection } from '../utils/deepseekTranslationApi'
import { AITranslationLoading, AITranslationSpinner } from './AITranslationLoading'
import { ShimmerInput, ShimmerTextarea } from './ShimmerInput'
import { Brain, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface DeepSeekTranslationTestProps {
  accessToken?: string
}

export function DeepSeekTranslationTest({ accessToken }: DeepSeekTranslationTestProps) {
  const [testText, setTestText] = useState('こんにちは')
  const [translatedText, setTranslatedText] = useState('')
  const [romajiText, setRomajiText] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  const handleTranslate = async () => {
    if (!testText.trim()) return

    setLoading(true)
    try {
      const result = await translateJapaneseToEnglish(testText, accessToken)
      setTranslatedText(result)
      toast.success('Terjemahan berhasil!')
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('Gagal menerjemahkan text')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertRomaji = async () => {
    if (!testText.trim()) return

    setLoading(true)
    try {
      const result = await convertJapaneseToRomaji(testText, accessToken)
      setRomajiText(result.translatedText)
      toast.success('Konversi Romaji berhasil!')
    } catch (error) {
      console.error('Romaji conversion error:', error)
      toast.error('Gagal mengkonversi ke Romaji')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const isConnected = await testOpenRouterConnection(accessToken)
      setConnectionStatus(isConnected)
      if (isConnected) {
        toast.success('Koneksi ke OpenRouter berhasil!')
      } else {
        toast.error('Koneksi ke OpenRouter gagal!')
      }
    } catch (error) {
      console.error('Connection test error:', error)
      setConnectionStatus(false)
      toast.error('Error testing connection')
    } finally {
      setTestingConnection(false)
    }
  }

  const quickTests = [
    { text: 'こんにちは', label: 'Hello' },
    { text: 'ありがとう', label: 'Thank you' },
    { text: '映画', label: 'Movie' },
    { text: '女優', label: 'Actress' },
    { text: '監督', label: 'Director' }
  ]

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>DeepSeek R1 Translation Test</CardTitle>
          <CardDescription>
            Test integrasi DeepSeek R1 melalui OpenRouter untuk fungsi translate dan konversi Romaji
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Test */}
          <div className="space-y-2">
            <Label>Test Koneksi OpenRouter</Label>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleTestConnection} 
                disabled={testingConnection}
                variant="outline"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              {connectionStatus !== null && (
                <Badge variant={connectionStatus ? 'default' : 'destructive'}>
                  {connectionStatus ? 'Connected' : 'Failed'}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Translation Test */}
          <div className="space-y-2">
            <Label htmlFor="test-text">Japanese Text</Label>
            <Input
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Masukkan text dalam bahasa Jepang..."
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTranslate} 
              disabled={loading || !testText.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <AITranslationSpinner size="sm" />
                  <span>AI Translating...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>Translate to English</span>
                </>
              )}
            </Button>
            <Button 
              onClick={handleConvertRomaji} 
              disabled={loading || !testText.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <AITranslationSpinner size="sm" />
                  <span>AI Converting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Convert to Romaji</span>
                </>
              )}
            </Button>
          </div>

          {/* Loading Visual */}
          <AITranslationLoading 
            text="DeepSeek R1 sedang memproses..."
            type="translation"
            isVisible={loading}
          />

          {/* Results */}
          {translatedText && (
            <div className="space-y-2">
              <Label>English Translation:</Label>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border">
                <p className="text-green-800 dark:text-green-200">{translatedText}</p>
              </div>
            </div>
          )}

          {romajiText && (
            <div className="space-y-2">
              <Label>Romaji:</Label>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border">
                <p className="text-blue-800 dark:text-blue-200">{romajiText}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Quick Tests */}
          <div className="space-y-2">
            <Label>Quick Tests:</Label>
            <div className="flex flex-wrap gap-2">
              {quickTests.map((test, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setTestText(test.text)}
                >
                  {test.text} ({test.label})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Integrasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <p><strong>Model:</strong> deepseek/deepseek-r1:free</p>
                <p><strong>Provider:</strong> OpenRouter</p>
                <p><strong>Status API Key:</strong> 
                  {connectionStatus === null ? ' Belum ditest' : 
                   connectionStatus ? ' ✅ Valid' : ' ❌ Invalid - Perlu API key baru'}
                </p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Japanese to English translation</li>
                  <li>Japanese to Romaji conversion</li>
                  <li>Fallback to MyMemory API jika DeepSeek gagal</li>
                  <li>Batch translation support</li>
                </ul>
                {connectionStatus === false && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>⚠️ API Key Invalid:</strong> Silakan dapatkan API key baru dari{' '}
                      <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">
                        OpenRouter
                      </a>{' '}
                      dan update konfigurasi. Lihat dokumentasi di{' '}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">docs/OPENROUTER_API_KEY_SETUP.md</code>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
    </div>
  )
}
