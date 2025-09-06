import { useState, useMemo } from 'react'
import { Movie } from '../../utils/movieApi'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { Tag } from 'lucide-react'

interface TagsContentProps {
  movies: Movie[]
  searchQuery: string
  onFilterSelect: (filterType: string, filterValue: string, title?: string) => void
}

interface TagInfo {
  name: string
  movieCount: number
}

export function TagsContent({ movies, searchQuery, onFilterSelect }: TagsContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  const tagsData = useMemo(() => {
    // Extract all tags and count movies
    const tagsMap = new Map<string, number>()
    
    movies.forEach(movie => {
      if (movie.tags) {
        const movieTags = movie.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        movieTags.forEach(tag => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1)
        })
      }
    })
    
    // Convert to array and sort by movie count (descending) then by name
    const tagsInfo: TagInfo[] = Array.from(tagsMap.entries()).map(([name, movieCount]) => ({
      name,
      movieCount
    }))
    
    // Sort by movie count (descending) then by name
    return tagsInfo.sort((a, b) => {
      if (a.movieCount !== b.movieCount) {
        return b.movieCount - a.movieCount
      }
      return a.name.localeCompare(b.name)
    })
  }, [movies])

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tagsData
    
    const query = searchQuery.toLowerCase()
    return tagsData.filter(tag =>
      tag.name.toLowerCase().includes(query)
    )
  }, [tagsData, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTags = filteredTags.slice(startIndex, startIndex + itemsPerPage)

  if (filteredTags.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? `No tags found for "${searchQuery}"` : 'No tags available'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredTags.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage)
          setCurrentPage(1)
        }}
      />

      {/* Tags Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {paginatedTags.map((tag) => (
          <Card 
            key={tag.name} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onFilterSelect('tag', tag.name, `Tag: ${tag.name}`)}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <Tag className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium line-clamp-2">{tag.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tag.movieCount} movies
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}