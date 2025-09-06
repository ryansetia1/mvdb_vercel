// Temporary file to add GroupFormDialog at the end of GroupsContent.tsx
// I need to find where the component returns and add the GroupFormDialog there

/* At the end of the component, add: */

      {/* Group Form Dialog */}
      <GroupFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        editingGroup={editingGroup}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        availableActresses={actresses}
        groupActresses={editingGroupActresses}
        actressOperationLoading={false}
        onAddActressToGroup={handleAddActressToGroup}
        onRemoveActressFromGroup={handleRemoveActressFromGroup}
        onCreateNewActress={handleCreateNewActress}
        accessToken={accessToken}
      />