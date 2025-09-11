// Bagian render content yang perlu diupdate di UnifiedApp.tsx
// Ini adalah implementasi render content dengan persistent filter states

// Di dalam return statement UnifiedApp, setelah header, ada bagian render content:

{/* Main Content */}
<main className="flex-1 overflow-auto">
  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
    {/* Back button when navigation history exists or in detail views */}
    {(navigationHistory.length > 0 || 
      contentState.mode === 'movieDetail' || 
      contentState.mode === 'scMovieDetail' || 
      contentState.mode === 'photobookDetail' || 
      contentState.mode === 'profile') && (
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    )}

    {/* Content Title */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{contentState.title}</h1>
    </div>

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
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleSCMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
        externalFilters={getCurrentFilters('soft')}
        onFiltersChange={(filters) => handleFiltersChange('soft', filters)}
      />
    )}

    {contentState.mode === 'photobooks' && (
      <PhotobooksContent
        photobooks={photobooks}
        searchQuery={searchQuery}
        onPhotobookSelect={handlePhotobookSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        externalFilters={getCurrentFilters('photobooks')}
        onFiltersChange={(filters) => handleFiltersChange('photobooks', filters)}
      />
    )}

    {contentState.mode === 'favorites' && (
      <FavoritesContent
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
        externalFilters={getCurrentFilters('favorites')}
        onFiltersChange={(filters) => handleFiltersChange('favorites', filters)}
      />
    )}

    {contentState.mode === 'actors' && (
      <ActorsContent
        actors={actors}
        searchQuery={searchQuery}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        onDataChange={reloadData}
      />
    )}

    {contentState.mode === 'actresses' && (
      <ActressesContent
        actresses={actresses}
        searchQuery={searchQuery}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        onDataChange={reloadData}
      />
    )}

    {contentState.mode === 'series' && (
      <SeriesContent
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
      />
    )}

    {contentState.mode === 'studios' && (
      <StudiosContent
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        accessToken={accessToken}
      />
    )}

    {contentState.mode === 'tags' && (
      <TagsContent
        movies={movies}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        accessToken={accessToken}
      />
    )}

    {contentState.mode === 'groups' && (
      <GroupsContent
        actresses={actresses}
        searchQuery={searchQuery}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        selectedGroup={contentState.data?.selectedGroup}
        onGroupSelect={handleGroupSelect}
      />
    )}

    {contentState.mode === 'movieDetail' && contentState.data && (
      <MovieDetailContent
        movie={contentState.data}
        onBack={handleBack}
        onEdit={handleEditMovie}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
      />
    )}

    {contentState.mode === 'scMovieDetail' && contentState.data && (
      <SCMovieDetailContent
        scMovie={contentState.data}
        onBack={handleBack}
        onEdit={handleEditSCMovie}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
      />
    )}

    {contentState.mode === 'photobookDetail' && contentState.data && (
      <PhotobookDetailContent
        photobook={contentState.data}
        onBack={handleBack}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
      />
    )}

    {contentState.mode === 'profile' && contentState.data && (
      <ProfileContent
        type={contentState.data.type}
        name={contentState.data.name}
        movies={movies}
        photobooks={photobooks}
        onMovieSelect={handleMovieSelect}
        onPhotobookSelect={handlePhotobookSelect}
        onProfileSelect={handleProfileSelect}
        onEdit={handleEditProfile}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
      />
    )}

    {contentState.mode === 'filteredMovies' && contentState.data && (
      <FilteredMoviesContent
        movies={movies}
        filterType={contentState.data.filterType}
        filterValue={contentState.data.filterValue}
        searchQuery={searchQuery}
        onMovieSelect={handleMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
        actorName={contentState.data.actorName}
        actressName={contentState.data.actressName}
      />
    )}

    {contentState.mode === 'filteredActresses' && contentState.data && (
      <FilteredActressesContent
        filterType={contentState.data.filterType}
        filterValue={contentState.data.filterValue}
        searchQuery={searchQuery}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
      />
    )}

    {contentState.mode === 'admin' && (
      <Dashboard
        accessToken={accessToken}
        user={user}
        onLogout={onLogout}
        onDataChanged={reloadData}
        editingMovie={showEditMovie}
        editingSCMovie={showEditSCMovie}
        editingProfile={showEditProfile}
        onClearEditingMovie={() => setShowEditMovie(null)}
        onClearEditingSCMovie={() => setShowEditSCMovie(null)}
        onClearEditingProfile={() => setShowEditProfile(null)}
      />
    )}

    {contentState.mode === 'advancedSearch' && (
      <AdvancedSearchContent
        movies={movies}
        filters={advancedSearchFilters}
        onFiltersChange={setAdvancedSearchFilters}
        onMovieSelect={handleMovieSelect}
        onProfileSelect={handleProfileSelect}
        accessToken={accessToken}
        actresses={actresses}
        actors={actors}
        directors={directors}
      />
    )}
  </div>
</main>