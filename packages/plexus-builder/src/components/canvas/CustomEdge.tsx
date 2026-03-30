'use client'

import { memo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow'
import { X } from 'lucide-react'

interface CustomEdgeData {
  type: string
  cardinality?: string
  onSelect: () => void
  onDelete: () => void
}

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  label
}: EdgeProps<CustomEdgeData>) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: (selected || isHovered) ? '#3b82f6' : '#94a3b8',
          strokeWidth: (selected || isHovered) ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
      />

      {/* Invisible thicker path for easier hover interaction - Moved after for better event capture */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={25}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: (selected || isHovered) ? 'all' : 'none',
            opacity: (selected || isHovered) ? 1 : 0,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`px-2 py-1 text-[10px] font-medium rounded shadow-sm bg-white border transition-all ${
              selected ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'
            }`}
            onClick={data?.onSelect}
          >
            {label || data?.type || 'RELATES_TO'}
          </div>
          
          {data?.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onDelete()
              }}
              className={`absolute -top-2 -right-2 text-white hover:bg-red-600 transition-all bg-red-500 rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm ${
                (selected || isHovered) ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              title="Delete Relationship"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

CustomEdge.displayName = 'CustomEdge'
