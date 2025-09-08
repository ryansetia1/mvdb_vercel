import React, { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  getTypeColors, 
  getTypeColorsFromDatabase,
  saveTypeColors, 
  saveTypeColorsToDatabase,
  resetTypeColors, 
  resetTypeColorsToDatabase,
  initializeTypeColors,
  DEFAULT_TYPE_COLORS,
  MovieTypeColorConfig 
} from '../utils/movieTypeColors'
import { masterDataApi, MasterDataItem } from '../utils/masterDataApi'
import { toast } from 'sonner'

interface Props {
  accessToken?: string
}

export function MovieTypeColorSettings({ accessToken }: Props) {
  const [colors, setColors] = useState<MovieTypeColorConfig>(DEFAULT_TYPE_COLORS)
  const [newColor, setNewColor] = useState('#3b82f6') // Default blue
  const [masterDataTypes, setMasterDataTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMasterType, setSelectedMasterType] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadColors = async () => {
      try {
        setIsLoading(true)
        
        // Initialize colors with defaults on first load
        initializeTypeColors()
        
        // Load colors from database if access token is available
        let currentColors: MovieTypeColorConfig
        if (accessToken) {
          currentColors = await getTypeColorsFromDatabase(accessToken)
        } else {
          currentColors = getTypeColors()
        }
        
        // Clean up any incorrect type names that don't match master data
        const cleaned = { ...currentColors }
        
        // Fix the 2version -> 2vers issue
        if (cleaned['2version'] && !cleaned['2vers']) {
          cleaned['2vers'] = cleaned['2version']
          delete cleaned['2version']
          console.log('Fixed type name: 2version -> 2vers')
        }
        
        // Save the cleaned version if any changes were made
        if (JSON.stringify(cleaned) !== JSON.stringify(currentColors)) {
          if (accessToken) {
            await saveTypeColorsToDatabase(cleaned, accessToken)
          } else {
            saveTypeColors(cleaned)
          }
        }
        
        setColors(cleaned)
        
        if (accessToken) {
          loadMasterDataTypes()
        }
      } catch (error) {
        console.error('Error loading colors:', error)
        // Fallback to localStorage
        const fallbackColors = getTypeColors()
        setColors(fallbackColors)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadColors()
  }, [accessToken])

  const loadMasterDataTypes = async () => {
    if (!accessToken) return
    
    setIsLoading(true)
    try {
      // Load types from master data only
      const masterTypes = await masterDataApi.getByType('type', accessToken)
      const typeNames = masterTypes.map(type => type.name).filter(Boolean) as string[]
      
      setMasterDataTypes(typeNames)
      
      console.log('Loaded master data types:', typeNames)
      
      // Sync existing color settings with master data
      const currentColors = accessToken ? await getTypeColorsFromDatabase(accessToken) : getTypeColors()
      const syncedColors = { ...currentColors }
      let hasChanges = false
      
      // Remove color settings for types that no longer exist in master data
      Object.keys(syncedColors).forEach(colorType => {
        const typeExists = typeNames.some(masterType => 
          masterType.toLowerCase() === colorType.toLowerCase()
        )
        if (!typeExists && !DEFAULT_TYPE_COLORS.hasOwnProperty(colorType)) {
          console.log(`Removing color for non-existent type: ${colorType}`)
          delete syncedColors[colorType]
          hasChanges = true
        }
      })
      
      // Save synced colors if there were changes
      if (hasChanges) {
        if (accessToken) {
          await saveTypeColorsToDatabase(syncedColors, accessToken)
        } else {
          saveTypeColors(syncedColors)
        }
        setColors(syncedColors)
        toast.info('Type colors synced with master data')
      }
      
    } catch (error) {
      console.error('Failed to load master data types:', error)
      toast.error('Failed to load master data types')
    } finally {
      setIsLoading(false)
    }
  }

  const handleColorChange = (type: string, color: string) => {
    const updated = { ...colors, [type]: color }
    setColors(updated)
    setHasUnsavedChanges(true)
    
    // Save to localStorage immediately for preview
    saveTypeColors(updated)
  }

  const handleSaveToDatabase = async () => {
    if (!accessToken) {
      toast.error('Please login to save colors to database')
      return
    }

    setIsSaving(true)
    try {
      await saveTypeColorsToDatabase(colors, accessToken)
      
      // Verify the save by re-reading from database
      const verified = await getTypeColorsFromDatabase(accessToken)
      const isSuccess = JSON.stringify(verified) === JSON.stringify(colors)
      
      if (isSuccess) {
        setHasUnsavedChanges(false)
        toast.success('Colors saved to database successfully')
      } else {
        console.error('Color save verification failed:', { expected: colors, actual: verified })
        toast.error('Failed to save colors to database - verification failed')
      }
    } catch (error) {
      console.error('Error saving colors to database:', error)
      toast.error('Failed to save colors to database')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTypeColor = () => {
    if (!selectedMasterType) {
      toast.error('Please select a type from master data')
      return
    }

    const typeToAdd = selectedMasterType.toLowerCase().trim()

    if (colors[typeToAdd]) {
      toast.error(`Type "${typeToAdd}" already has a color configured`)
      return
    }

    const updated = { ...colors, [typeToAdd]: newColor }
    setColors(updated)
    setHasUnsavedChanges(true)
    
    // Save to localStorage immediately for preview
    saveTypeColors(updated)
    
    setSelectedMasterType('')
    setNewColor('#3b82f6')
    toast.success(`Added color for type "${typeToAdd}" (local preview)`)
  }

  // Helper function to get contrast text color
  const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Helper function to check if color is hex format
  const isHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color)
  }

  const handleRemoveType = async (type: string) => {
    const updated = { ...colors }
    delete updated[type]
    setColors(updated)
    
    try {
      if (accessToken) {
        await saveTypeColorsToDatabase(updated, accessToken)
      } else {
        saveTypeColors(updated)
      }
      toast.success(`Removed type "${type}"`)
    } catch (error) {
      console.error('Error removing type color:', error)
      toast.error(`Failed to remove type "${type}"`)
    }
  }

  const handleReset = async () => {
    try {
      if (accessToken) {
        await resetTypeColorsToDatabase(accessToken)
        const resetColors = await getTypeColorsFromDatabase(accessToken)
        setColors(resetColors)
      } else {
        resetTypeColors()
        setColors(getTypeColors()) // Get the reset colors from storage
      }
      toast.success('Reset to default colors')
    } catch (error) {
      console.error('Error resetting colors:', error)
      toast.error('Failed to reset colors')
    }
  }

  const handleSyncWithMasterData = async () => {
    if (!accessToken) return
    
    setIsLoading(true)
    try {
      // Reload master data types first
      await loadMasterDataTypes()
      toast.success('Synced with master data successfully')
    } catch (error) {
      console.error('Failed to sync with master data:', error)
      toast.error('Failed to sync with master data')
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Movie Type Colors</h3>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Unsaved Changes
                </Badge>
              )}
              {accessToken && (
                <Button 
                  onClick={handleSaveToDatabase}
                  disabled={isSaving || !hasUnsavedChanges}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      💾 Save to Database
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize colors for movie types from master data. Changes are saved locally for preview. 
            {accessToken ? ' Click "Save to Database" to persist changes.' : ' Login to save changes to database.'}
          </p>
        </div>

        {/* Current Types */}
        <div className="space-y-3">
          <h4 className="font-medium">Current Types</h4>
          {Object.entries(colors).length > 0 ? (
            Object.entries(colors).map(([type, colorValue]) => {
              const isDefaultType = DEFAULT_TYPE_COLORS.hasOwnProperty(type)
              // Check if this type exists in master data
              const existsInMasterData = masterDataTypes.some(masterType => 
                masterType.toLowerCase() === type.toLowerCase()
              )
              
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge 
                      style={isHexColor(colorValue) ? {
                        backgroundColor: colorValue,
                        color: getContrastTextColor(colorValue)
                      } : {}}
                      className={!isHexColor(colorValue) ? colorValue : ''}
                    >
                      {type.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      {type}
                    </span>
                    {isDefaultType && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                    {!existsInMasterData && !isDefaultType && (
                      <Badge variant="destructive" className="text-xs">Not in Master Data</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={isHexColor(colorValue) ? colorValue : '#6b7280'}
                      onChange={(e) => handleColorChange(type, e.target.value)}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      title="Choose color"
                    />
                    <span className="text-xs text-muted-foreground font-mono w-16">
                      {isHexColor(colorValue) ? colorValue.toUpperCase() : 'Legacy'}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveType(type)}
                      title={isDefaultType ? 'Remove from display (can be restored with Reset)' : 'Remove type color'}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No type colors configured. Use "Reset to Defaults" to restore default types.
            </div>
          )}
        </div>

        {/* Add Color for Master Data Types */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium">Add Color for Master Data Types</h4>
          <p className="text-sm text-muted-foreground">
            Select a type from master data to configure its color. New types can only be added in Master Data Manager.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="masterType">Select Type from Master Data</Label>
              <Select 
                value={selectedMasterType} 
                onValueChange={setSelectedMasterType}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isLoading ? "Loading master data types..." : "Choose from master data"} />
                </SelectTrigger>
                <SelectContent>
                  {masterDataTypes.length > 0 ? (
                    masterDataTypes
                      .filter(type => !colors[type.toLowerCase()])
                      .map(type => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Master</Badge>
                            {type}
                          </div>
                        </SelectItem>
                      ))
                  ) : (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {isLoading ? 'Loading...' : 'No types found in master data'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newColor">Color</Label>
              <input
                type="color"
                id="newColor"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-16 h-8 border border-gray-300 rounded cursor-pointer mt-1"
                title="Choose color"
              />
            </div>
            <Button onClick={handleAddTypeColor} disabled={isLoading}>
              Add Color
            </Button>
          </div>
          
          {/* Refresh button */}
          {accessToken && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={loadMasterDataTypes}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh Master Data'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Colors */}
        <div className="space-y-3">
          <h4 className="font-medium">Quick Colors</h4>
          <div className="flex flex-wrap gap-2">
            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#6b7280', '#000000'].map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                title={`Select ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            {accessToken && (
              <Button 
                variant="outline" 
                onClick={handleSyncWithMasterData}
                disabled={isLoading}
              >
                {isLoading ? 'Syncing...' : 'Sync with Master Data'}
              </Button>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Changes are saved automatically
            </p>
            <p className="text-xs text-muted-foreground">
              Add new types in <span className="font-medium">Master Data Manager → Types</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}