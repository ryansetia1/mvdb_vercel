import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { normalizeJapaneseNames } from '../utils/japaneseNameNormalizer'

interface LabelFormProps {
  accessToken: string
  data: MasterDataItem[]
  onDataChange: (data: MasterDataItem[]) => void
}

export function LabelForm({ accessToken, data, onDataChange }: LabelFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    jpname: '',
    kanjiName: '',
    kanaName: '',
    labelLinks: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        jpname: editingItem.jpname || '',
        kanjiName: editingItem.kanjiName || '',
        kanaName: editingItem.kanaName || '',
        labelLinks: editingItem.labelLinks || ''
      })
    } else {
      setFormData({
        name: '',
        jpname: '',
        kanjiName: '',
        kanaName: '',
        labelLinks: ''
      })
    }
  }, [editingItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Label name is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Normalize Japanese names to avoid redundancy
      const normalizedNames = normalizeJapaneseNames({
        jpname: formData.jpname,
        kanjiName: formData.kanjiName
      })

      const normalizedFormData = {
        ...formData,
        jpname: normalizedNames.jpname,
        kanjiName: normalizedNames.kanjiName
      }

      if (editingItem) {
        const updated = await masterDataApi.updateExtended('label', editingItem.id, normalizedFormData, accessToken)
        const newData = data.map(item => item.id === editingItem.id ? updated : item)
        onDataChange(newData)
      } else {
        const newItem = await masterDataApi.createExtended('label', normalizedFormData, accessToken)
        onDataChange([...data, newItem])
      }
      
      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData({ name: '', jpname: '', kanjiName: '', kanaName: '', labelLinks: '' })
    } catch (error: any) {
      setError(`Failed to save label: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (item: MasterDataItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await masterDataApi.delete('label', item.id, accessToken)
      const newData = data.filter(d => d.id !== item.id)
      onDataChange(newData)
    } catch (error: any) {
      setError(`Failed to delete: ${error.message}`)
    }
  }

  const openEditDialog = (item: MasterDataItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Production Labels</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Label
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Label' : 'Add New Label'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <Label htmlFor="name">Label Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Universal Pictures, Warner Bros"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jpname">Nama Jepang</Label>
                <Input
                  id="jpname"
                  value={formData.jpname}
                  onChange={(e) => setFormData(prev => ({ ...prev, jpname: e.target.value }))}
                  placeholder="Masukkan nama label dalam bahasa Jepang"
                />
              </div>

              <div>
                <Label htmlFor="kanjiName">Kanji Name</Label>
                <Input
                  id="kanjiName"
                  value={formData.kanjiName}
                  onChange={(e) => setFormData(prev => ({ ...prev, kanjiName: e.target.value }))}
                  placeholder="Masukkan nama dalam kanji (漢字)"
                />
              </div>

              <div>
                <Label htmlFor="kanaName">Kana Name</Label>
                <Input
                  id="kanaName"
                  value={formData.kanaName}
                  onChange={(e) => setFormData(prev => ({ ...prev, kanaName: e.target.value }))}
                  placeholder="Masukkan nama dalam kana (かな)"
                />
              </div>

              <div>
                <Label htmlFor="labelLinks">Links (Optional)</Label>
                <Textarea
                  id="labelLinks"
                  value={formData.labelLinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, labelLinks: e.target.value }))}
                  placeholder="Official website, IMDB, Wikipedia links, etc."
                  rows={3}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Separate multiple links with commas
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No labels yet. Click "Add Label" to create one.
          </div>
        ) : (
          <div className="grid gap-2">
            {data.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.jpname && (
                      <div className="text-sm text-muted-foreground">
                        {item.jpname}
                        {item.kanjiName && ` (${item.kanjiName})`}
                        {item.kanaName && ` [${item.kanaName}]`}
                      </div>
                    )}
                    {item.labelLinks && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <ExternalLink className="h-3 w-3 inline mr-1" />
                        Links available
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {item.id}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      onClick={() => openEditDialog(item)}
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDelete(item)}
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {error && !isDialogOpen && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}