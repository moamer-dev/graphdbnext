'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { X, Circle } from 'lucide-react'
import type { Node } from '../../types'

interface CustomNodeData {
  label: string
  type: string
  properties: Node['properties']
  onSelect: () => void
  onDelete: () => void
  workflowCount?: number
  isRoot?: boolean
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <div
      className={`relative rounded-lg border transition-all bg-white ${
        data.isRoot 
          ? 'border-amber-400 border-2 bg-linear-to-br from-yellow-50 to-amber-50 shadow-md' 
          : selected 
            ? 'border-gray-400 border-2 shadow-md' 
            : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => {
        // Don't stop propagation - let ReactFlow handle the click
        // This prevents double-selection calls
        console.log('[custom-node] click', { label: data.label, type: data.type })
      }}
      style={{ minWidth: 80, padding: '6px 10px' }}
    >
      {/* Main content - icon and label in horizontal layout */}
      <div className="flex items-center gap-1.5 pr-4">
        <Circle className={`h-3 w-3 shrink-0 ${data.isRoot ? 'text-amber-600' : 'text-blue-600'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="text-[11px] font-semibold text-gray-900 truncate">{data.label}</div>
            {data.isRoot && (
              <span className="inline-flex items-center rounded-full bg-amber-500 text-white px-0.5 py-0.5 text-[6px] font-bold leading-none shrink-0">
                ROOT
              </span>
            )}
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5 truncate">{data.type}</div>
          {(data.properties.length > 0 || Boolean(data.workflowCount)) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {data.properties.length > 0 && (
                <span className="text-[8px] text-gray-500">
                  {data.properties.length} prop{data.properties.length !== 1 ? 's' : ''}
                </span>
              )}
              {Boolean(data.workflowCount) && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-0.5 py-0.5 text-[7px] font-medium">
                  {data.workflowCount} workflow{data.workflowCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete button - top right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete()
        }}
        className="absolute top-0.5 right-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors z-10"
        title="Delete node"
      >
        <X className="h-2.5 w-2.5" />
      </button>
      
      {/* Relation In - circular port on top */}
      <Handle
        type="target"
        position={Position.Top}
        id="relation-in"
        style={{ 
          left: '20%', 
          background: '#6b7280', 
          width: 8, 
          height: 8, 
          borderRadius: '50%',
          border: '1px solid white',
          top: -4
        }}
        title="Relation In"
      />
      <div className="absolute -top-6 left-[20%] transform -translate-x-1/2 pointer-events-none">
        <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">
          -relation in-
        </span>
      </div>
      
      {/* Relation Out - circular port on bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="relation-out"
        style={{ 
          left: '20%', 
          background: '#6b7280', 
          width: 8, 
          height: 8, 
          borderRadius: '50%',
          border: '1px solid white',
          bottom: -4
        }}
        title="Relation Out"
      />
      <div className="absolute -bottom-3 left-[20%] transform -translate-x-1/2 pointer-events-none">
        <span className="text-[8px] font-medium text-gray-600 whitespace-nowrap">
          -relation out-
        </span>
      </div>
      
      {/* Tools - rectangular grey port on left */}
      <Handle
        type="source"
        position={Position.Left}
        id="tools"
        style={{ 
          top: '50%', 
          background: '#9ca3af', 
          width: 6, 
          height: 12, 
          borderRadius: 2,
          border: '1px solid #6b7280',
          left: -3
        }}
        title="Tools"
      />
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full -ml-1 pointer-events-none">
        <span className="text-[8px] font-medium text-gray-600 whitespace-nowrap">
          -tools-
        </span>
      </div>
    </div>
  )
})

CustomNode.displayName = 'CustomNode'

