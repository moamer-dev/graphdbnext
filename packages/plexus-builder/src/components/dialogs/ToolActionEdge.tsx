'use client'

import { memo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow'
import { X } from 'lucide-react'

interface ToolActionEdgeData {
  onDelete: () => void
}

export const ToolActionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style
}: EdgeProps<ToolActionEdgeData>) => {
  const [isHovered, setIsHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  // Create a wider invisible path for hover detection
  const hoverPath = edgePath

  return (
    <>
      <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <BaseEdge
          id={id}
          path={edgePath}
          style={style}
        />
        {/* Invisible wider path for better hover detection */}
        <path
          d={hoverPath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'pointer' }}
        />
      </g>
      <EdgeLabelRenderer>
        {(isHovered || selected) && data?.onDelete && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onDelete()
              }}
              className="bg-white border border-red-300 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center shadow-sm transition-colors z-10"
              title="Delete connection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
})

ToolActionEdge.displayName = 'ToolActionEdge'

