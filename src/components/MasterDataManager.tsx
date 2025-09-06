import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Trash2, Users, User, Film, Building, Clapperboard, Tag, ImageIcon } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { ExtendedForm } from './ExtendedForm'
import { SeriesForm } from './SeriesForm'
import { StudioForm } from './StudioForm'
import { LabelForm } from './LabelForm'
import { GroupForm } from './GroupForm'
import { CoverTemplateManager } from './CoverTemplateManager'
import { DirectorSelector } from './DirectorSelector'
import { EditableTypeItem } from './EditableTypeItem'
import { MovieTypeColorSettings } from './MovieTypeColorSettings'

interface MasterDataManagerProps {
  accessToken: string
}

const masterDataTypes = [
  { key: 'actress', label: 'Aktris', icon: Users, extended: true },
  { key: 'actor', label: 'Aktor', icon: User, extended: true },
  { key: 'group', label: 'Groups', icon: Users, extended: true },
  { key: 'director', label: 'Director', icon: Clapperboard, extended: false },
  { key: 'series', label: 'Series', icon: Film, extended: true },
  { key: 'studio', label: 'Studio', icon: Building, extended: true },
  { key: 'type', label: 'Type', icon: Film, extended: false },
  { key: 'tag', label: 'Tag', icon: Tag, extended: false },
  { key: 'label', label: 'Label', icon: Badge, extended: true },
  { key: 'cover-templates', label: 'Cover Templates', icon: ImageIcon, extended: true }
]

export function MasterDataManager({ accessToken }: MasterDataManagerProps) {
  const [data, setData] = useState<Record<string, MasterDataItem[]>>({})
  const [newItems, setNewItems] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [healthCheckResult, setHealthCheckResult] = useState<string>('')

  // Perform health check and load default data on component mount
  useEffect(() => {
    const performHealthCheck = async () => {
      try {
        const result = await masterDataApi.healthCheck()
        setHealthCheckResult(`✅ Server healthy (${result.timestamp})`)
        // Load default tab data after successful health check
        await loadData('actress')
      } catch (error: any) {
        setHealthCheckResult(`❌ Server unreachable: ${error.message}`)
        setError(`Server connectivity issue: ${error.message}`)
      }
    }
    
    performHealthCheck()
  }, [])

  const loadData = async (type: string) => {
    setIsLoading(prev => ({ ...prev, [type]: true }))
    setError('') // Clear any previous errors
    
    try {
      console.log(`UI: Loading ${type} data`)
      const items = await masterDataApi.getByType(type)
      console.log(`UI: Loaded ${items.length} ${type} items`)
      setData(prev => ({ ...prev, [type]: items }))
    } catch (error: any) {
      console.error(`UI: Error loading ${type}:`, error)
      const errorMessage = `Gagal memuat ${type}: ${error.message}`
      setError(errorMessage)
      
      // Auto-clear error after 10 seconds
      setTimeout(() => {
        setError('')
      }, 10000)
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleAdd = async (type: string) => {
    const name = newItems[type]?.trim()
    if (!name) return

    console.log(`UI: Attempting to add ${type} with name: "${name}"`)
    setError('') // Clear any previous errors
    
    try {
      const newItem = await masterDataApi.create(type, name, accessToken)
      console.log(`UI: Successfully added ${type}:`, newItem)
      
      setData(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), newItem]
      }))
      setNewItems(prev => ({ ...prev, [type]: '' }))
    } catch (error: any) {
      console.error(`UI: Error adding ${type}:`, error)
      const errorMessage = `Gagal menambah ${type}: ${error.message}`
      setError(errorMessage)
      
      // Auto-clear error after 10 seconds
      setTimeout(() => {
        setError('')
      }, 10000)
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return

    try {
      await masterDataApi.delete(type, id, accessToken)
      setData(prev => ({
        ...prev,
        [type]: prev[type]?.filter(item => item.id !== id) || []
      }))
      setError('')
    } catch (error: any) {
      setError(`Gagal menghapus: ${error.message}`)
    }
  }

  const handleInputChange = (type: string, value: string) => {
    setNewItems(prev => ({ ...prev, [type]: value }))
  }

  const handleKeyPress = (e: React.KeyboardEvent, type: string) => {
    if (e.key === 'Enter') {
      handleAdd(type)
    }
  }

  const handleDataChange = (type: string, newData: MasterDataItem[]) => {
    setData(prev => ({
      ...prev,
      [type]: newData
    }))
  }

  const renderFormComponent = (key: string, extended: boolean) => {
    // Special case for director - use DirectorSelector component
    if (key === 'director') {
      return (
        <DirectorSelector
          accessToken={accessToken}
          directors={data[key] || []}
          onDirectorAdd={(director) => {
            setData(prev => ({
              ...prev,
              [key]: [...(prev[key] || []), director]
            }))
          }}
          onDirectorDelete={(id) => {
            setData(prev => ({
              ...prev,
              [key]: prev[key]?.filter(item => item.id !== id) || []
            }))
          }}
          onDirectorUpdate={(updatedDirector) => {
            setData(prev => ({
              ...prev,
              [key]: prev[key]?.map(item => item.id === updatedDirector.id ? updatedDirector : item) || []
            }))
          }}
        />
      )
    }

    if (!extended) {
      // Special handling for 'type' to include Movie Type Color Settings
      if (key === 'type') {
        return (
          <div className="space-y-6">
            {/* Type Management Section */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Add new ${masterDataTypes.find(t => t.key === key)?.label.toLowerCase()}...`}
                  value={newItems[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, key)}
                />
                <Button onClick={() => handleAdd(key)} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading[key] ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(data[key] || []).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No {key}s found. Add one above to get started.
                      </div>
                    ) : (
                      (data[key] || []).map((item) => (
                        <EditableTypeItem
                          key={item.id}
                          item={item}
                          type={key as 'type' | 'tag'}
                          accessToken={accessToken}
                          onUpdate={(updatedItem) => {
                            setData(prev => ({
                              ...prev,
                              [key]: prev[key]?.map(existingItem => 
                                existingItem.id === updatedItem.id ? updatedItem : existingItem
                              ) || []
                            }))
                          }}
                          onDelete={(deletedId) => {
                            setData(prev => ({
                              ...prev,
                              [key]: prev[key]?.filter(item => item.id !== deletedId) || []
                            }))
                          }}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <div className="font-medium mb-1">💡 Sync Feature</div>
                <div>When you edit a {key} name, all movies using the old name will be automatically updated to use the new name across the entire database.</div>
              </div>
            </div>

            {/* Movie Type Color Settings Section */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Movie Type Color Settings</h4>
              <MovieTypeColorSettings accessToken={accessToken} />
            </div>
          </div>
        )
      }

      // Editable form for tag with sync functionality
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={`Add new ${masterDataTypes.find(t => t.key === key)?.label.toLowerCase()}...`}
              value={newItems[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, key)}
            />
            <Button onClick={() => handleAdd(key)} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading[key] ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-2">
                {(data[key] || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {key}s found. Add one above to get started.
                  </div>
                ) : (
                  (data[key] || []).map((item) => (
                    <EditableTypeItem
                      key={item.id}
                      item={item}
                      type={key as 'type' | 'tag'}
                      accessToken={accessToken}
                      onUpdate={(updatedItem) => {
                        setData(prev => ({
                          ...prev,
                          [key]: prev[key]?.map(existingItem => 
                            existingItem.id === updatedItem.id ? updatedItem : existingItem
                          ) || []
                        }))
                      }}
                      onDelete={(deletedId) => {
                        setData(prev => ({
                          ...prev,
                          [key]: prev[key]?.filter(item => item.id !== deletedId) || []
                        }))
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div className="font-medium mb-1">💡 Sync Feature</div>
            <div>When you edit a {key} name, all movies using the old name will be automatically updated to use the new name across the entire database.</div>
          </div>
        </div>
      )
    }

    // Extended forms for different types
    switch (key) {
      case 'actress':
      case 'actor':
        return (
          <ExtendedForm
            type={key as 'actor' | 'actress'}
            accessToken={accessToken}
            data={data[key] || []}
            onDataChange={(newData) => handleDataChange(key, newData)}
          />
        )
      
      case 'series':
        return (
          <SeriesForm
            accessToken={accessToken}
            data={data[key] || []}
            onDataChange={(newData) => handleDataChange(key, newData)}
          />
        )
      
      case 'studio':
        return (
          <StudioForm
            accessToken={accessToken}
            data={data[key] || []}
            onDataChange={(newData) => handleDataChange(key, newData)}
          />
        )
      
      case 'label':
        return (
          <LabelForm
            accessToken={accessToken}
            data={data[key] || []}
            onDataChange={(newData) => handleDataChange(key, newData)}
          />
        )
      
      case 'group':
        return (
          <GroupForm
            accessToken={accessToken}
          />
        )
      
      case 'cover-templates':
        return (
          <CoverTemplateManager
            accessToken={accessToken}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Master Data Management</CardTitle>
          <div className="flex items-center gap-2">
            {healthCheckResult && (
              <div className="text-xs text-muted-foreground">
                {healthCheckResult}
              </div>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={async () => {
                try {
                  setError('')
                  const result = await masterDataApi.healthCheck()
                  setHealthCheckResult(`✅ Test successful (${result.timestamp})`)
                } catch (error: any) {
                  setHealthCheckResult(`❌ Test failed: ${error.message}`)
                  setError(`Test failed: ${error.message}`)
                }
              }}
            >
              Test API
            </Button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
            <div className="text-red-600 text-sm font-medium">Error:</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
            <div className="text-red-400 text-xs mt-2">
              Check browser console for detailed logs
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="actress" className="w-full" onValueChange={(value) => value !== 'cover-templates' && value !== 'group' && loadData(value)}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-10 w-full">
            {masterDataTypes.map(({ key, label, icon: Icon }) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="flex items-center gap-1"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {masterDataTypes.map(({ key, label, extended }) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {renderFormComponent(key, extended)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}