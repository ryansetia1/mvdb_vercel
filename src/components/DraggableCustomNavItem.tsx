import { useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Button } from './ui/button'
import { X, GripVertical } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  type: 'movies' | 'soft' | 'photobooks' | 'actors' | 'actresses' | 'series' | 'studios' | 'tags' | 'groups' | 'favorites' | 'custom' | 'admin'
  filterType?: string
  filterValue?: string
  icon?: React.ReactNode
}

interface DraggableCustomNavItemProps {
  item: NavItem
  index: number
  activeNavItem: string
  editMode: boolean
  onNavClick: (item: NavItem) => void
  onRemove: (itemId: string) => void
  onMoveItem: (fromIndex: number, toIndex: number) => void
}

interface DragItem {
  type: string
  index: number
  id: string
}

export function DraggableCustomNavItem({
  item,
  index,
  activeNavItem,
  editMode,
  onNavClick,
  onRemove,
  onMoveItem
}: DraggableCustomNavItemProps) {
  const [isDragging, setIsDragging] = useState(false)

  const [{ opacity }, drag, preview] = useDrag({
    type: 'customNavItem',
    item: () => {
      setIsDragging(true)
      return { type: 'customNavItem', index, id: item.id }
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    }),
    end: () => {
      setIsDragging(false)
    },
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'customNavItem',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover: (draggedItem: DragItem) => {
      if (draggedItem.index !== index) {
        onMoveItem(draggedItem.index, index)
        draggedItem.index = index
      }
    },
  })

  const isActive = isOver && canDrop

  return (
    <div 
      ref={(node) => preview(drop(node))} 
      className={`flex items-center gap-1 transition-all duration-200 ${
        isActive ? 'bg-accent/50 rounded-md p-1' : ''
      } ${isDragging ? 'scale-105' : ''}`}
      style={{ opacity }}
    >
      <div className="flex items-center gap-1">
        {editMode && (
          <div
            ref={drag}
            className="cursor-grab hover:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <Button
          variant={activeNavItem === item.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onNavClick(item)}
          className={`flex items-center gap-2 transition-all duration-200 ${
            editMode ? 'cursor-pointer' : ''
          } ${isDragging ? 'shadow-lg' : ''}`}
          disabled={editMode && isDragging}
        >
          {item.icon}
          {item.label}
        </Button>
        {editMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}