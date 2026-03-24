'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { X, Play } from 'lucide-react'

interface WorkflowBlockData {
  label: string
  type: string
  targetNodeId?: string
  onSelect: () => void
  onDelete: () => void
}

export const WorkflowBlock = memo(({ data, selected }: NodeProps<WorkflowBlockData>) => {
  return (
    <div
      className={`relative rounded-lg border transition-all bg-white shadow-sm ${
        selected 
          ? 'border-amber-500 border-2 shadow-md' 
          : 'border-amber-200 hover:border-amber-300'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        data.onSelect()
      }}
      style={{ minWidth: 120, padding: '8px 12px' }}
    >
      <div className="flex items-center gap-2 pr-6">
        <div className="bg-amber-100 p-1 rounded-md">
          <Play className="h-3 w-3 text-amber-600 fill-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-gray-900 truncate">{data.label}</div>
          <div className="text-[9px] text-amber-600 font-medium uppercase tracking-wider">{data.type.replace('workflow:', '')}</div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete()
        }}
        className="absolute top-1 right-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors z-10"
        title="Delete step"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Target Handle (Input) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#f59e0b', width: 8, height: 8, border: '2px solid white' }}
      />

      {/* Source Handle (Output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#f59e0b', width: 8, height: 8, border: '2px solid white' }}
      />
    </div>
  )
})

WorkflowBlock.displayName = 'WorkflowBlock'

export default WorkflowBlock
