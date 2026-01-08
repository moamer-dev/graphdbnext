import { useMemo, useCallback } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import type { Node as BuilderNode, Relationship } from '../../types'

export function useCanvasVisibility() {
  const {
    nodes: storeNodes,
    relationships: storeRelationships,
    hideUnconnectedNodes,
    selectedNode,
    selectedRelationship
  } = useModelBuilderStore()

  const visibleNodeIds = useMemo(() => {
    if (!hideUnconnectedNodes) {
      return new Set(storeNodes.map((n: BuilderNode) => n.id))
    }
    
    if (selectedNode) {
      const visible = new Set<string>([selectedNode])
      
      storeRelationships.forEach((rel: Relationship) => {
        if (rel.from === selectedNode) {
          visible.add(rel.to)
        }
        if (rel.to === selectedNode) {
          visible.add(rel.from)
        }
      })
      
      return visible
    }
    
    if (selectedRelationship) {
      const rel = storeRelationships.find((r: Relationship) => r.id === selectedRelationship)
      if (rel) {
        return new Set<string>([rel.from, rel.to])
      }
    }
    
    return new Set<string>()
  }, [hideUnconnectedNodes, storeNodes, storeRelationships, selectedNode, selectedRelationship])

  const isNodeVisible = useCallback((nodeId: string) => {
    return visibleNodeIds.has(nodeId)
  }, [visibleNodeIds])

  return {
    visibleNodeIds,
    isNodeVisible
  }
}

