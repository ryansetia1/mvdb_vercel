import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Users } from 'lucide-react'
import { GroupCard } from './groupForm/GroupCard'
import { GroupFormDialog } from './groupForm/GroupFormDialog'
import { useGroupForm } from './groupForm/useGroupForm'

interface GroupFormProps {
  accessToken: string
}

export function GroupForm({ accessToken }: GroupFormProps) {
  const {
    groups,
    isLoading,
    error,
    success,
    editingGroup,
    showDialog,
    formData,
    availableActresses,
    groupActresses,
    actressOperationLoading,
    setShowDialog,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleInputChange,
    handleAddActressToGroup,
    handleRemoveActressFromGroup,
    handleCreateNewActress
  } = useGroupForm({ accessToken })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Actress Groups</h2>
          <Badge variant="outline">{groups.length} groups</Badge>
        </div>
        
        <Button onClick={handleCreate} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Groups List */}
      {isLoading && groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups created yet</h3>
          <p className="text-gray-500 mb-4">Create your first actress group to organize your database</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <GroupFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingGroup={editingGroup}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        availableActresses={availableActresses}
        groupActresses={groupActresses}
        actressOperationLoading={actressOperationLoading}
        onAddActressToGroup={handleAddActressToGroup}
        onRemoveActressFromGroup={handleRemoveActressFromGroup}
        onCreateNewActress={handleCreateNewActress}
        accessToken={accessToken}
      />
    </div>
  )
}