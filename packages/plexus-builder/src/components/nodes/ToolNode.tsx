'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { X } from 'lucide-react'
import { workflowRegistry } from '../../registry'

interface ToolNodeData {
  label: string
  type: string
  onSelect: () => void
  onDelete: () => void
  inputs?: number
  outputs?: Array<{ id: string; label: string }>
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  subtitle?: string
}

// Helper to get icon and color for tool type
function getToolIconAndColor(type: string): { Icon: React.ComponentType<{ className?: string }> | null; color: string } {
  const tool = workflowRegistry.getTool(type)
  if (tool) {
    return { Icon: tool.metadata.icon as any, color: tool.metadata.color || 'text-gray-600' }
  }
  return { Icon: null, color: 'text-gray-600' }
}

export const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => {
  const inputs = data.inputs ?? 1
  const outputs = data.outputs ?? [{ id: 'output', label: 'Output' }]
  const isIfElse = data.type === 'tool:if'
  
  const isSwitch = data.type === 'tool:switch'
  
  // Get icon and color
  const { Icon: ToolIcon, color: iconColor } = data.icon 
    ? { Icon: data.icon, color: data.iconColor || 'text-gray-600' }
    : getToolIconAndColor(data.type)

  return (
    <div
      className={`relative rounded border transition-all bg-white min-w-[100px] ${
        selected 
          ? 'border-gray-400 border-2 shadow-md' 
          : 'border-gray-300 hover:border-gray-400'
      } ${isSwitch ? 'flex flex-col pb-1.5' : 'h-[36px]'}`}
      onClick={() => {
        // ReactFlow handles selection
      }}
      style={{ padding: isSwitch ? '6px 0 0 0' : '6px 24px 35px 10px' }}
    >
      {/* Input handles - rectangular grey ports on left */}
      {Array.from({ length: inputs }).map((_, index) => {
        const topPosition = inputs === 1 ? '50%' : `${(index + 1) * (100 / (inputs + 1))}%`
        return (
          <Handle
            key={`input-${index}`}
            type="target"
            position={Position.Left}
            id={`input-${index}`}
            style={{
              top: topPosition,
              background: '#9ca3af',
              width: 5,
              height: 10,
              borderRadius: 2,
              border: '1px solid #6b7280',
              left: -2.5
            }}
            title={`Input ${index + 1}`}
          />
        )
      })}

      {/* Main content - Header section / Tool Identity */}
      <div className={isSwitch ? "flex items-center gap-1.5 px-2.5 pb-1 pr-7" : "flex items-center gap-1.5 pr-4"}>
        {ToolIcon && (
          <ToolIcon className={`h-3 w-3 ${iconColor} shrink-0`} />
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-bold text-gray-900 truncate ${isSwitch ? 'leading-tight' : ''}`}>{data.label}</div>
          {data.subtitle && (
            <div className="text-[9px] text-gray-500 mt-0.5 truncate leading-none">{data.subtitle}</div>
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
        title="Delete tool"
      >
        <X className="h-2.5 w-2.5" />
      </button>

      {/* Outputs section */}
      {isSwitch ? (
        /* Flexible rows for Switch */
        <div className="mt-1 flex flex-col gap-1 border-t border-gray-100 pt-1.5 pb-1">
          {outputs.map((output) => (
            <div key={output.id} className="relative flex items-center justify-end h-5 px-2">
              <span className="text-[8px] font-semibold text-gray-500 whitespace-nowrap uppercase tracking-tighter opacity-80 mr-1.5">
                {output.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{
                  top: '50%',
                  background: '#6b7280',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1px solid white',
                  right: -4,
                  transform: 'translateY(-50%)'
                }}
                title={output.label}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Original compact handles for other tools */
        outputs.map((output, index) => {
          const totalOutputs = outputs.length
          const topPosition = totalOutputs === 1 ? '50%' : `${(index + 1) * (100 / (totalOutputs + 1))}%`
          const isIfElseOutput = isIfElse && (output.id === 'true' || output.id === 'false')
          const color = isIfElseOutput
            ? output.id === 'true'
              ? '#10b981' // green for true
              : '#ef4444' // red for false
            : '#6b7280' // grey for regular outputs

          return (
            <div key={output.id} className="absolute right-0" style={{ top: topPosition, transform: 'translateY(-50%)' }}>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{
                  top: '50%',
                  background: color,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1px solid white',
                  right: -4
                }}
                title={output.label}
              />
              <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <span className="text-[8px] font-medium text-gray-600 whitespace-nowrap">
                  -{output.label.toLowerCase()}-
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

})

ToolNode.displayName = 'ToolNode'

