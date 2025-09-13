import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Trash2, RefreshCw, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useCachedData } from '../hooks/useCachedData'
import { toast } from 'sonner'

interface CacheManagerProps {
  className?: string
}

export function CacheManager({ className = '' }: CacheManagerProps) {
  const { cache, invalidateCache, isDataFresh } = useCachedData()
  const [isOpen, setIsOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const getCacheStatus = (type: keyof typeof cache) => {
    const cacheItem = cache[type]
    if (!cacheItem || !cacheItem.data || cacheItem.data.length === 0) {
      return { status: 'empty', icon: AlertCircle, color: 'text-gray-500' }
    }
    
    if (isDataFresh(type)) {
      return { status: 'fresh', icon: CheckCircle, color: 'text-green-600' }
    } else {
      return { status: 'stale', icon: Clock, color: 'text-yellow-600' }
    }
  }

  const getCacheAge = (timestamp: number) => {
    if (!timestamp) return 'Never'
    const ageMs = Date.now() - timestamp
    const ageMinutes = Math.floor(ageMs / (1000 * 60))
    const ageHours = Math.floor(ageMinutes / 60)
    const ageDays = Math.floor(ageHours / 24)
    
    if (ageDays > 0) return `${ageDays}d ${ageHours % 24}h ago`
    if (ageHours > 0) return `${ageHours}h ${ageMinutes % 60}m ago`
    if (ageMinutes > 0) return `${ageMinutes}m ago`
    return 'Just now'
  }

  const handleClearAllCache = async () => {
    setIsClearing(true)
    try {
      invalidateCache()
      toast.success('Semua cache telah dibersihkan')
      setIsOpen(false)
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Gagal membersihkan cache')
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearSpecificCache = async (type: keyof typeof cache) => {
    setIsClearing(true)
    try {
      invalidateCache(type)
      toast.success(`Cache ${type} telah dibersihkan`)
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error(`Gagal membersihkan cache ${type}`)
    } finally {
      setIsClearing(false)
    }
  }

  const cacheTypes = [
    { key: 'movies', label: 'Movies', description: 'Data film dan metadata' },
    { key: 'actresses', label: 'Actresses', description: 'Data aktris dan foto profil' },
    { key: 'actors', label: 'Actors', description: 'Data aktor dan foto profil' },
    { key: 'directors', label: 'Directors', description: 'Data sutradara' },
    { key: 'studios', label: 'Studios', description: 'Data studio produksi' },
    { key: 'series', label: 'Series', description: 'Data seri film' },
    { key: 'labels', label: 'Labels', description: 'Data label distribusi' },
    { key: 'photobooks', label: 'Photobooks', description: 'Data photobook' }
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Database className="h-4 w-4 mr-2" />
          Cache Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Manager
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cache Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cache Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {cacheTypes.map(({ key, label }) => {
                  const cacheItem = cache[key]
                  const status = getCacheStatus(key)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {cacheItem?.data?.length || 0} items
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Cache Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detailed Cache Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cacheTypes.map(({ key, label, description }) => {
                  const cacheItem = cache[key]
                  const status = getCacheStatus(key)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          <span className="font-medium">{label}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {status.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last updated: {getCacheAge(cacheItem?.timestamp || 0)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearSpecificCache(key)}
                        disabled={isClearing || !cacheItem?.data?.length}
                        className="ml-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Cache membantu mempercepat loading data. Bersihkan jika data tidak terupdate.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isClearing}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAllCache}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Cache
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
