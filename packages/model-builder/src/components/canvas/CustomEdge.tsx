'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, MarkerType, type EdgeProps } from 'reactflow'

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
          stroke: selected ? '#3b82f6' : '#94a3b8',
          strokeWidth: selected ? 3 : 2,
          cursor: 'pointer'
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan"
        >
          <div
            className={`px-2 py-1 text-xs rounded bg-white border ${
              selected ? 'border-primary' : 'border-gray-300'
            }`}
            onClick={data?.onSelect}
          >
            {label || data?.type || 'RELATES_TO'}
          </div>
          {selected && data?.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onDelete()
              }}
              className="absolute -top-2 -right-2 text-red-500 hover:text-red-700 text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center border border-red-300"
            >
              ×
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

CustomEdge.displayName = 'CustomEdge'

