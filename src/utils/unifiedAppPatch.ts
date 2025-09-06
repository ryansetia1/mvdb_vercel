// Patch untuk menambahkan persistent filter states ke UnifiedApp.tsx
// Bagian render content yang perlu diupdate dengan persistent filter props

const renderContentWithPersistentFilters = `
    {/* Dynamic Content Based on Mode */}
    {contentState.mode === 'movies' && (
      <MoviesContent
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
        externalFilters={getCurrentFilters('movies')}
        onFiltersChange={(filters) => handleFiltersChange('movies', filters)}
      />
    )}

    {contentState.mode === 'soft' && (
      <SoftContent
        searchQuery={searchQuery}
        accessToken={accessToken}
        onSCMovieSelect={handleSCMovieSelect}
        externalFilters={getCurrentFilters('soft')}
        onFiltersChange={(filters) => handleFiltersChange('soft', filters)}
      />
    )}

    {contentState.mode === 'photobooks' && (
      <PhotobooksContent
        accessToken={accessToken}
        onPhotobookSelect={handlePhotobookSelect}
        searchQuery={searchQuery}
        externalFilters={getCurrentFilters('photobooks')}
        onFiltersChange={(filters) => handleFiltersChange('photobooks', filters)}
      />
    )}

    {contentState.mode === 'favorites' && (
      <FavoritesContent
        accessToken={accessToken}
        onMovieSelect={handleMovieSelect}
        onPhotobookSelect={handlePhotobookSelect}
        onProfileSelect={handleProfileSelect}
        searchQuery={searchQuery}
        cachedMovies={movies}
        cachedPhotobooks={photobooks}
        cachedCast={[...actors, ...actresses]}
        externalFilters={getCurrentFilters('favorites')}
        onFiltersChange={(filters) => handleFiltersChange('favorites', filters)}
      />
    )}
`;

export default renderContentWithPersistentFilters;