import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Key, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { setupOpenRouterApiKey, ensureApiKeyExists } from '../utils/setupSupabaseSecrets'
import { getApiKeyFromSupabaseSecrets } from '../utils/supabaseSecretsApi'
import { toast } from 'sonner'
import { Bot } from 'lucide-react'
import { AVAILABLE_MODELS, getSelectedModel, setSelectedModel } from '../utils/aiSettings'

interface SetupApiKeyProps {
  accessToken: string
}

export function SetupApiKey({ accessToken }: SetupApiKeyProps) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'exists' | 'missing'>('unknown')
  const [selectedModel, setLocalSelectedModel] = useState(getSelectedModel())

  const handleModelChange = (modelId: string) => {
    setLocalSelectedModel(modelId)
    setSelectedModel(modelId)
    toast.success(`Model diganti ke: ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}`)
  }

  const handleCheckKey = async () => {
    if (!accessToken) return

    setChecking(true)
    try {
      const existingKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
      if (existingKey) {
        setKeyStatus('exists')
        toast.success('API key sudah ada di Supabase secrets')
      } else {
        setKeyStatus('missing')
        toast.warning('API key tidak ditemukan di Supabase secrets')
      }
    } catch (error) {
      console.error('Error checking API key:', error)
      setKeyStatus('missing')
      toast.error('Gagal mengecek API key')
    } finally {
      setChecking(false)
    }
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim() || !accessToken) return

    setLoading(true)
    try {
      const success = await setupOpenRouterApiKey(accessToken, apiKey.trim())

      if (success) {
        setKeyStatus('exists')
        setApiKey('')
        toast.success('API key berhasil disimpan di Supabase secrets!')
      } else {
        toast.error('Gagal menyimpan API key')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('Terjadi error saat menyimpan API key')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (keyStatus) {
      case 'exists':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (keyStatus) {
      case 'exists':
        return 'API key sudah tersimpan di Supabase secrets'
      case 'missing':
        return 'API key tidak ditemukan di Supabase secrets'
      default:
        return 'Status API key belum dicek'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Setup SumoPod API Key
        </CardTitle>
        <CardDescription>
          Simpan API key SumoPod ke Supabase secrets untuk keamanan yang lebih baik
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Check */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>

          <Button
            onClick={handleCheckKey}
            disabled={checking || !accessToken}
            variant="outline"
            className="w-full"
          >
            {checking ? 'Checking...' : 'Check API Key Status'}
          </Button>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey">SumoPod API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key SumoPod (sk-...)"
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSaveKey}
            disabled={loading || !apiKey.trim() || !accessToken}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save to Supabase Secrets'}
          </Button>
        </div>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Cara mendapatkan API key:</strong><br />
            1. Kunjungi <a href="https://ai.sumopod.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SumoPod AI</a><br />
            2. Daftar atau login ke akun Anda<br />
            3. Navigate ke bagian API Keys<br />
            4. Buat API key baru<br />
            5. Copy dan paste ke form di atas
          </AlertDescription>
        </Alert>

        {/* Security Note */}
        <Alert>
          <AlertDescription>
            <strong>Keamanan:</strong> API key akan disimpan secara terenkripsi di Supabase secrets dan hanya dapat diakses oleh user yang terautentikasi.
          </AlertDescription>
        </Alert>
        {/* AI Model Selection */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <Label className="text-base font-semibold">AI Model Selection</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih model AI yang akan digunakan untuk fitur translation dan auto-fill.
          </p>

          <div className="grid gap-4">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.id}
                className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors ${selectedModel === model.id ? 'border-primary bg-accent' : 'border-border'
                  }`}
                onClick={() => handleModelChange(model.id)}
              >
                <div className="flex h-5 items-center">
                  <input
                    type="radio"
                    name="ai-model"
                    checked={selectedModel === model.id}
                    onChange={() => handleModelChange(model.id)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium cursor-pointer">
                      {model.name}
                    </Label>
                    {model.label && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${model.label === 'cheapest' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        model.label === 'fastest' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          model.label === 'best_quality' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                        {model.label === 'cheapest' ? 'Cheapest' :
                          model.label === 'fastest' ? 'Fastest' :
                            model.label === 'best_quality' ? 'Best Quality' :
                              model.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Input: ${model.inputPrice}/1M tokens</span>
                    <span>Output: ${model.outputPrice}/1M tokens</span>
                    <span>Context: {(model.contextLength / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
