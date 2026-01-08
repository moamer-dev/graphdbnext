'use client'

import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { ChevronDown, ChevronRight, Plus, X, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { ActionSelectorDialog } from '../dialogs/ActionSelectorDialog'
import { useActionGroup, type ActionGroupNodeData } from '../../hooks'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

const ActionGroupNodeComponent = ({ data, selected }: NodeProps<ActionGroupNodeData>) => {
  // Read child actions directly from store to get live updates
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const liveChildren = useMemo(() => {
    if (!data.children || data.children.length === 0) return []
    return data.children.map(childData => {
      // Find the latest version of this child action from the store
      const liveChild = actionNodes.find(n => n.id === childData.id)
      return liveChild 
        ? { id: liveChild.id, label: liveChild.label, type: liveChild.type }
        : childData // Fallback to data if not found in store
    })
  }, [data.children, actionNodes])

  // Action group hook
  const {
    isExpanded,
    showActionSelector,
    setShowActionSelector,
    actionCount,
    handleToggleExpand,
    handleAddAction,
    handleActionSelected,
    handleRemoveChildAction,
    handleSelectChildAction,
    handleMoveActionUp,
    handleMoveActionDown
  } = useActionGroup(data)

  return (
    <div
      className={`rounded border shadow-sm text-[11px] bg-purple-50 border-purple-200 ${
        selected ? 'border-purple-500' : ''
      }`}
      style={{ minWidth: 100 }}
      onClick={() => {}}
    >
      {/* Input handle - rectangular purple port on left */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          top: '50%', 
          background: '#a855f7',
          width: 5,
          height: 10,
          borderRadius: 2,
          border: '1px solid #6b7280',
          left: -2.5
        }}
        title="Input"
      />

      {/* Header */}
      <div className="px-1 py-0.5 border-b border-purple-200">
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleToggleExpand}
            className="p-0.5 hover:bg-purple-100 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-2 w-2 text-purple-600" />
            ) : (
              <ChevronRight className="h-2 w-2 text-purple-600" />
            )}
          </button>
          <div className="text-[11px] font-semibold truncate flex-1">{data.label || 'Action Group'}</div>
          <div className="text-[7px] bg-purple-200 text-purple-700 px-0.5 py-0.5 rounded">
            {liveChildren?.length ?? actionCount}
          </div>
          <button
            className="text-red-500 hover:bg-red-50 rounded p-0.5"
            onClick={(e) => {
              e.stopPropagation()
              data.onDelete?.()
            }}
            title="Delete group"
          >
            <X className="h-2 w-2" />
          </button>
        </div>
        <div className="text-[8px] text-purple-700 truncate mt-0.5">{data.type}</div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div 
          className="px-1 py-1 space-y-0.5 bg-white min-h-[60px]"
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const actionType = e.dataTransfer.getData('application/action-type') || 
                              e.dataTransfer.getData('text/plain')
            if (actionType && actionType.startsWith('action:') && actionType !== 'action:group') {
              // Check if this action type already exists in the group
              const actionTypeToAdd = actionType as import('../../stores/actionCanvasStore').ActionNodeType
              const existingTypes = data.children?.map(c => c.type) || []
              if (existingTypes.includes(actionTypeToAdd)) {
                return
              }
              data.onAddAction?.([actionTypeToAdd])
            }
          }}
        >
          {liveChildren && liveChildren.length > 0 ? (
            <>
              {liveChildren.map((child, index) => (
                <div
                  key={child.id}
                  className="px-1 py-0.5 bg-green-50 border border-green-200 rounded text-[8px] flex items-center justify-between group hover:bg-green-100 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectChildAction(child.id)
                  }}
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-[7px] text-gray-500">{index + 1}.</span>
                    <span className="font-medium truncate">{child.label}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[7px] text-green-600 truncate ml-0.5">{child.type}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="text-blue-500 hover:bg-blue-50 rounded p-0.5"
                        onClick={(e) => {
                          handleMoveActionUp(e, child.id)
                        }}
                        title="Move up"
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-2 w-2" />
                      </button>
                      <button
                        className="text-blue-500 hover:bg-blue-50 rounded p-0.5"
                        onClick={(e) => {
                          handleMoveActionDown(e, child.id)
                        }}
                        title="Move down"
                        disabled={index === (liveChildren?.length ?? 0) - 1}
                      >
                        <ChevronDown className="h-2 w-2" />
                      </button>
                      <button
                        className="text-red-500 hover:bg-red-50 rounded p-0.5"
                        onClick={(e) => {
                          handleRemoveChildAction(e, child.id)
                        }}
                        title="Remove from group"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-4 text-[8px] mt-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddAction()
                }}
              >
                <Plus className="h-2 w-2 mr-0.5" />
                Add Action
              </Button>
            </>
          ) : (
            <div className="text-center py-2 text-[8px] text-gray-500">
              <p>No actions in group</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-4 text-[8px] mt-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddAction()
                }}
              >
                <Plus className="h-2 w-2 mr-0.5" />
                Add First Action
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action Selector Dialog */}
      <ActionSelectorDialog
        open={showActionSelector}
        onClose={() => setShowActionSelector(false)}
        onSelect={(actionTypes) => {
          handleActionSelected(actionTypes)
        }}
      />
    </div>
  )
}

ActionGroupNodeComponent.displayName = 'ActionGroupNode'

// Custom comparison function to ensure re-render when children change
const areEqual = (prevProps: NodeProps<ActionGroupNodeData>, nextProps: NodeProps<ActionGroupNodeData>) => {
  // Check version first (most reliable)
  if (prevProps.data._version !== nextProps.data._version) {
    return false // Re-render
  }
  
  // Always re-render if children array changes
  const prevChildrenIds = prevProps.data.children?.map(c => c.id).join(',') || ''
  const nextChildrenIds = nextProps.data.children?.map(c => c.id).join(',') || ''
  
  if (prevChildrenIds !== nextChildrenIds) {
    return false // Re-render
  }
  
  // Check other important props
  if (prevProps.data.isExpanded !== nextProps.data.isExpanded) {
    return false
  }
  
  if (prevProps.data.actionCount !== nextProps.data.actionCount) {
    return false
  }
  
  if (prevProps.selected !== nextProps.selected) {
    return false
  }
  
  return true // Don't re-render
}

// Export memoized component with custom comparison
export const ActionGroupNode = memo(ActionGroupNodeComponent, areEqual)

