import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Plus, Trash2, ExternalLink, Search } from 'lucide-react'
import { CheckTakuLinksDialog } from './CheckTakuLinksDialog'

interface MultipleTakuLinksProps {
  links: string[]
  onChange: (links: string[]) => void
  jpname?: string
  alias?: string
  name?: string
}

export function MultipleTakuLinks({ links, onChange, jpname = '', alias = '', name = '' }: MultipleTakuLinksProps) {
  const [showCheckDialog, setShowCheckDialog] = useState(false)
  const [selectedName, setSelectedName] = useState('')

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    onChange(newLinks)
  }

  const addLink = () => {
    onChange([...links, ''])
  }

  const removeLink = (index: number) => {
    if (links.length > 1) {
      const newLinks = links.filter((_, i) => i !== index)
      onChange(newLinks)
    }
  }

  const openLink = (url: string) => {
    if (url.trim()) {
      window.open(url, '_blank')
    }
  }

  const handleAddTakuLink = (url: string) => {
    // Check if there are any empty fields first
    const emptyIndex = links.findIndex(link => !link.trim())
    
    if (emptyIndex !== -1) {
      // Fill the first empty field
      const newLinks = [...links]
      newLinks[emptyIndex] = url
      onChange(newLinks)
    } else {
      // Add new field if no empty fields exist
      const newLinks = [...links, url]
      onChange(newLinks)
    }
  }


  // Listen for custom event to reopen dialog with selected name
  useEffect(() => {
    const handleReopenDialog = (event: CustomEvent) => {
      const { selectedName } = event.detail
      setSelectedName(selectedName)
      setShowCheckDialog(true)
    }

    window.addEventListener('reopenTakuLinksDialog', handleReopenDialog as EventListener)
    
    return () => {
      window.removeEventListener('reopenTakuLinksDialog', handleReopenDialog as EventListener)
    }
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Taku Links</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCheckDialog(true)}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          >
            <Search className="h-4 w-4 mr-1" />
            Check Taku Links
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Link
          </Button>
        </div>
      </div>
      
      {links.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">Belum ada taku links</p>
          <Button type="button" variant="outline" size="sm" onClick={addLink} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Tambah Link Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder={`https://example.com/taku-link-${index + 1}`}
                />
              </div>
              
              {link.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openLink(link)}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Bulk textarea input option */}
      <details className="mt-4">
        <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
          Input Multiple Links Sekaligus (Opsional)
        </summary>
        <div className="mt-2 space-y-2">
          <Textarea
            placeholder="Paste multiple links here, one per line"
            onChange={(e) => {
              const newLinks = e.target.value.split('\n').filter(link => link.trim())
              if (newLinks.length > 0) {
                onChange(newLinks)
              }
            }}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Paste multiple links separated by new lines. This will replace current links.
          </p>
        </div>
      </details>

      {/* Check Taku Links Dialog */}
      <CheckTakuLinksDialog
        isOpen={showCheckDialog}
        onClose={() => {
          setShowCheckDialog(false)
          setSelectedName('') // Reset selectedName when closing
        }}
        jpname={jpname}
        alias={alias}
        name={name}
        selectedName={selectedName}
        onAddTakuLink={handleAddTakuLink}
      />
    </div>
  )
}