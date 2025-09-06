import { TagsManager } from '../TagsManager'
import { Movie } from '../../utils/movieApi'

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

      {/* Info Section */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">Metadata Information</h4>
        <div className="text-sm text-green-700 space-y-2">
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
      </div>

      {/* Tag Examples */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Contoh Tags Populer:</h5>
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
      </div>
    </div>
  )
}