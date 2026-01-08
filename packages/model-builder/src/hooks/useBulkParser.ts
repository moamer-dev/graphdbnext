import { useMemo } from 'react'
import { 
  parseBulkNodeInput, 
  parseBulkRelationshipInput,
  type ParsedNode,
  type ParsedRelationship 
} from '../services/parseService'
import type { Node } from '../types'

/**
 * Hook for parsing bulk node input
 */
export function useBulkNodeParser (input: string) {
  const parsedNodes = useMemo(() => {
    if (!input.trim()) return []
    return parseBulkNodeInput(input)
  }, [input])

  const nodeCount = parsedNodes.length

  return {
    parsedNodes,
    nodeCount
  }
}

/**
 * Hook for parsing bulk relationship input
 */
export function useBulkRelationshipParser (input: string, nodes: Node[]) {
  const parsedRelationships = useMemo(() => {
    if (!input.trim()) return []
    return parseBulkRelationshipInput(input, nodes)
  }, [input, nodes])

  const relationshipCount = parsedRelationships.length

  return {
    parsedRelationships,
    relationshipCount
  }
}

