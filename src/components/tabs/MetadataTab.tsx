import React from 'react'
import { TagsManager } from '../TagsManager'
import { CollapsibleInfo } from '../ui/CollapsibleInfo'
import { Movie } from '../../utils/movieApi'
import { Tags, Lightbulb } from 'lucide-react'

interface MetadataTabProps {
  formData: Partial<Movie>
  onMultiSelectChange: (field: string, values: string[]) => void
  accessToken: string
}

export function MetadataTab({ 
  formData, 
  onMultiSelectChange,
  accessToken 
}: MetadataTabProps) {
  
  const handleTagsChange = (newTags: string) => {
    const tagValues = newTags ? newTags.split(',').map(v => v.trim()).filter(v => v) : []
    onMultiSelectChange('tags', tagValues)
  }

  return (
    <div className="space-y-4">
      <div>
        <TagsManager
          currentTags={formData.tags || ''}
          onTagsChange={handleTagsChange}
          accessToken={accessToken}
        />
      </div>

      {/* Collapsible Info Sections */}
      <div className="mt-6 space-y-3">
        <CollapsibleInfo 
          title="Metadata Information" 
          variant="green" 
          icon={<Tags className="h-4 w-4" />}
        >
          <div className="space-y-2">
            <p>
              <strong>Tags</strong> digunakan untuk mengkategorikan dan mencari film berdasarkan:
            </p>
            <ul className="ml-4 space-y-1">
              <li>• <strong>Genre:</strong> Action, Romance, Drama, Comedy, dll</li>
              <li>• <strong>Tema:</strong> School, Office, Outdoor, Fantasy, dll</li>
              <li>• <strong>Karakteristik:</strong> Uncensored, HD, New Release, dll</li>
              <li>• <strong>Rating:</strong> Explicit, Mature, Teen, dll</li>
              <li>• <strong>Format:</strong> VR, 4K, Subtitled, dll</li>
            </ul>
            <div className="mt-2 text-xs text-green-600">
              💡 Tips: Gunakan tags yang konsisten untuk memudahkan pencarian dan filtering
            </div>
          </div>
        </CollapsibleInfo>

        <CollapsibleInfo 
          title="Contoh Tags Populer" 
          variant="gray" 
          size="sm"
          icon={<Lightbulb className="h-4 w-4" />}
        >
          <div className="flex flex-wrap gap-1 text-xs">
            {[
              'Romance', 'Drama', 'Action', 'Comedy', 'School', 'Office', 'Outdoor', 
              'Fantasy', 'HD', 'Uncensored', 'New Release', 'Popular', 'Exclusive',
              '4K', 'VR', 'Subtitled', 'Series', 'Standalone'
            ].map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </CollapsibleInfo>
      </div>
    </div>
  )
}