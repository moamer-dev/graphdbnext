'use client'

import { useMemo } from 'react'
import type { GraphNode } from './useNodeList'
import { getNodeSpecificLabel } from '@/lib/utils/nodeUtils'

interface UseNodeFilteringOptions {
  nodesForLabel: GraphNode[]
  availableNodes: GraphNode[]
  createdNodes: GraphNode[]
  selectedNodeLabel: string
  toNodeId?: number | string
  fromNodeId?: number | string
  searchTerm?: string
}

export function useNodeFiltering ({
  nodesForLabel,
  availableNodes,
  createdNodes,
  selectedNodeLabel,
  toNodeId,
  fromNodeId,
  searchTerm = ''
}: UseNodeFilteringOptions) {
  const allAvailableNodes = useMemo(() => {
    if (!selectedNodeLabel) {
      return []
    }

    const nodeMap = new Map<string | number, GraphNode>()
    
    nodesForLabel.forEach(node => {
      const nodeId = node.nodeId || node.id
      nodeMap.set(nodeId, node)
    })
    
    availableNodes.forEach(node => {
      const nodeId = node.nodeId || node.id
      const nodeLabel = getNodeSpecificLabel(node)
      if (nodeLabel === selectedNodeLabel) {
        nodeMap.set(nodeId, node)
      }
    })
    
    createdNodes.forEach(node => {
      const nodeId = node.nodeId || node.id
      const nodeLabel = getNodeSpecificLabel(node)
      if (nodeLabel === selectedNodeLabel || String(nodeId) === String(toNodeId)) {
        nodeMap.set(nodeId, node)
      }
    })
    
    return Array.from(nodeMap.values())
  }, [nodesForLabel, availableNodes, createdNodes, selectedNodeLabel, toNodeId])

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) {
      return allAvailableNodes
    }
    
    const searchLower = searchTerm.toLowerCase()
    
    const checkPropertyValue = (value: unknown): boolean => {
      if (value === null || value === undefined) return false
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower)
      }
      
      if (typeof value === 'number') {
        return String(value).includes(searchLower)
      }
      
      if (Array.isArray(value)) {
        return value.some(item => checkPropertyValue(item))
      }
      
      if (typeof value === 'object') {
        return Object.values(value).some(item => checkPropertyValue(item))
      }
      
      return false
    }

    return allAvailableNodes.filter(node => {
      const idMatch = String(node.nodeId || node.id).includes(searchLower)
      const propertiesMatch = Object.values(node.properties || {}).some(value => checkPropertyValue(value))
      return idMatch || propertiesMatch
    })
  }, [allAvailableNodes, searchTerm])

  const allNodesForFromNode = useMemo(() => {
    const nodeMap = new Map<string | number, GraphNode>()
    
    availableNodes.forEach(node => {
      const nodeId = node.nodeId || node.id
      nodeMap.set(nodeId, node)
    })
    
    createdNodes.forEach(node => {
      const nodeId = node.nodeId || node.id
      nodeMap.set(nodeId, node)
    })
    
    return Array.from(nodeMap.values())
  }, [availableNodes, createdNodes])

  const selectedFromNode = useMemo(() => {
    return allNodesForFromNode.find(n => {
      const nodeId = n.nodeId || n.id
      return String(nodeId) === String(fromNodeId)
    })
  }, [allNodesForFromNode, fromNodeId])

  const selectedToNode = useMemo(() => {
    return allAvailableNodes.find(n => {
      const nodeId = n.nodeId || n.id
      return String(nodeId) === String(toNodeId)
    })
  }, [allAvailableNodes, toNodeId])

  return {
    allAvailableNodes,
    filteredNodes,
    allNodesForFromNode,
    selectedFromNode,
    selectedToNode
  }
}
