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

interface SetupApiKeyProps {
  accessToken: string
}

export function SetupApiKey({ accessToken }: SetupApiKeyProps) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'exists' | 'missing'>('unknown')

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
          Setup OpenRouter API Key
        </CardTitle>
        <CardDescription>
          Simpan API key OpenRouter ke Supabase secrets untuk keamanan yang lebih baik
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
            <Label htmlFor="apiKey">OpenRouter API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key OpenRouter"
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
            1. Kunjungi <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter.ai</a><br />
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
      </CardContent>
    </Card>
  )
}
