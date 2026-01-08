'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { X } from 'lucide-react'
import { actionCategories } from '../../constants/workflowItems'

interface ActionNodeData {
  label: string
  type: string
  subtitle?: string
  onSelect: () => void
  onDelete: () => void
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
}

// Helper to get icon and color for action type
function getActionIconAndColor(type: string): { Icon: React.ComponentType<{ className?: string }> | null; color: string } {
  for (const category of Object.values(actionCategories)) {
    const action = category.actions.find(a => a.type === type)
    if (action) {
      return { Icon: action.icon, color: action.color || 'text-gray-600' }
    }
  }
  return { Icon: null, color: 'text-gray-600' }
}

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  // Get icon and color
  const { Icon: ActionIcon, color: iconColor } = data.icon 
    ? { Icon: data.icon, color: data.iconColor || 'text-gray-600' }
    : getActionIconAndColor(data.type)

  return (
    <div
      className={`relative rounded border transition-all bg-white ${
        selected 
          ? 'border-gray-400 border-2 shadow-md' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => {
        // Don't stop propagation - let ReactFlow handle the click
        console.log('[action-node] click', { label: data.label, type: data.type })
      }}
      style={{ minWidth: 80, padding: '6px 10px' }}
    >
      {/* Input handle - rectangular grey port on left */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          top: '50%', 
          background: '#9ca3af', 
          width: 5, 
          height: 10, 
          borderRadius: 2,
          border: '1px solid #6b7280',
          left: -2.5
        }}
        title="Input"
      />
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full -ml-1 pointer-events-none">
        <span className="text-[8px] font-medium text-gray-600 whitespace-nowrap">
          -input-
        </span>
      </div>

      {/* Main content - icon and label in horizontal layout */}
      <div className="flex items-center gap-1.5 pr-4">
        {ActionIcon && (
          <ActionIcon className={`h-3 w-3 ${iconColor} shrink-0`} />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-gray-900 truncate">{data.label}</div>
          {data.subtitle && (
            <div className="text-[9px] text-gray-500 mt-0.5 truncate">{data.subtitle}</div>
          )}
        </div>
      </div>
      
      {/* Delete button - top right corner */}
      <button
        className="absolute top-0.5 right-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors z-10"
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete?.()
        }}
        title="Delete action"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  )
})

ActionNode.displayName = 'ActionNode'

