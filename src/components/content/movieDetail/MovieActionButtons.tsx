import { Button } from '../../ui/button'
import { SimpleFavoriteButton } from '../../SimpleFavoriteButton'
import { ArrowLeft, Edit, Save, X, FileText } from 'lucide-react'
import { Movie } from '../../../utils/movieApi'

interface MovieActionButtonsProps {
  movie: Movie
  isEditing: boolean
  isSaving: boolean
  showEditButton: boolean
  onBack?: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onParseMovie?: () => void
}

export function MovieActionButtons({
  movie,
  isEditing,
  isSaving,
  showEditButton,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onParseMovie
}: MovieActionButtonsProps) {
  return (
    <div className="flex justify-between items-center">
      {/* Back Button */}
      {onBack && (
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
      )}

      {/* Favorite & Edit/Save/Cancel Buttons */}
      <div className="flex items-center gap-2">
        {/* Favorite Button */}
        <SimpleFavoriteButton
          type="movie"
          itemId={movie.id || ''}
          size="lg"
          variant="outline"
        />

        {/* Parse Movie Button */}
        {onParseMovie && (
          <Button
            variant="outline"
            size="lg"
            onClick={onParseMovie}
            className="flex items-center gap-2 px-6 py-3"
          >
            <FileText className="h-5 w-5" />
            Parse Movie
          </Button>
        )}

        {/* Edit/Save/Cancel Buttons */}
        {showEditButton && (
          <>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Save className="h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={onEdit}
                className="flex items-center gap-2 px-6 py-3"
              >
                <Edit className="h-5 w-5" />
                Edit Movie
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}