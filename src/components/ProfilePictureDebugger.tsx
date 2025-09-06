import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { masterDataApi, MasterDataItem } from '../utils/masterDataApi'
import { ClickableProfileAvatar } from './ClickableProfileAvatar'
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { ClipboardStatus } from './ClipboardStatus'

interface ProfilePictureDebuggerProps {
  accessToken: string
}

export function ProfilePictureDebugger({ accessToken }: ProfilePictureDebuggerProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [actressesData, actorsData] = await Promise.all([
        masterDataApi.getByType('actress'),
        masterDataApi.getByType('actor')
      ])
      setActresses(actressesData)
      setActors(actorsData)
    } catch (error) {
      console.error('Failed to load debug data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const renderPersonDebug = (person: MasterDataItem, type: 'actress' | 'actor') => {
    const hasProfilePicture = Boolean(person.profilePicture?.trim())
    const hasPhoto = Boolean(person.photo && person.photo.length > 0)
    
    return (
      <div key={person.id} className="flex items-center gap-3 p-3 border rounded-lg">
        <ClickableProfileAvatar
          src={person.profilePicture}
          name={person.name || 'Unknown'}
          size="md"
        />
        
        <div className="flex-1">
          <div className="font-medium">{person.name}</div>
          <div className="text-sm text-muted-foreground">ID: {person.id}</div>
          
          <div className="flex gap-2 mt-1">
            {hasProfilePicture ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Profile Picture
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                No Profile Picture
              </Badge>
            )}
            
            {hasPhoto ? (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {person.photo?.length} Photos
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No Photos
              </Badge>
            )}
          </div>
          
          {hasProfilePicture && (
            <div className="text-xs text-muted-foreground mt-1 break-all">
              {person.profilePicture?.substring(0, 50)}...
            </div>
          )}
        </div>
      </div>
    )
  }

  const actressesWithoutPP = actresses.filter(a => !a.profilePicture?.trim())
  const actorsWithoutPP = actors.filter(a => !a.profilePicture?.trim())
  const totalPeople = actresses.length + actors.length
  const totalWithPP = actresses.filter(a => a.profilePicture?.trim()).length + 
                     actors.filter(a => a.profilePicture?.trim()).length

  return (
    <div className="space-y-6">
      {/* Clipboard Status */}
      <div className="flex justify-center">
        <ClipboardStatus />
      </div>
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Profile Picture Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{totalPeople}</div>
              <div className="text-sm text-muted-foreground">Total People</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalWithPP}</div>
              <div className="text-sm text-muted-foreground">With Profile Pictures</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{totalPeople - totalWithPP}</div>
              <div className="text-sm text-muted-foreground">Without Profile Pictures</div>
            </div>
            <div>
              <Button onClick={loadData} disabled={isLoading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Fix Profile Pictures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <strong>To add profile pictures to existing actors/actresses:</strong>
          </div>
          <ol className="text-sm space-y-2 ml-4">
            <li>1. Go to Admin Panel → Actors/Actresses tab</li>
            <li>2. Click "Edit" on any actor/actress</li>
            <li>3. Add profile picture URL in the "Foto Profil" section</li>
            <li>4. Click "Update" to save</li>
          </ol>
          <div className="text-xs text-muted-foreground mt-3">
            The first photo will be used as the main profile picture for avatars.
          </div>
        </CardContent>
      </Card>

      {/* Actresses without profile pictures */}
      {actressesWithoutPP.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Actresses Without Profile Pictures ({actressesWithoutPP.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {actressesWithoutPP.map(actress => renderPersonDebug(actress, 'actress'))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actors without profile pictures */}
      {actorsWithoutPP.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Actors Without Profile Pictures ({actorsWithoutPP.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {actorsWithoutPP.map(actor => renderPersonDebug(actor, 'actor'))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}