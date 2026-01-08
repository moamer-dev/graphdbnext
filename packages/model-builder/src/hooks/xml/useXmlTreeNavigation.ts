import { useState, useMemo, useRef, useCallback } from 'react'
import type { XmlStructureAnalysis } from '../../services/xmlAnalyzer'

export function useXmlTreeNavigation(analysis?: XmlStructureAnalysis) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<{ path: string; key: string } | null>(null)
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null)
  const [matchingPaths, setMatchingPaths] = useState<string[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1)
  const [visitedMatches, setVisitedMatches] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'tree' | 'nodes'>('tree')
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [nodesSearchQuery, setNodesSearchQuery] = useState('')
  const previousSearchQuery = useRef<string>('')
  const highlightedNodeRef = useRef<HTMLDivElement>(null)

  const allElementTypes = useMemo(() => {
    if (!analysis) return []
    return analysis.elementTypes
      .filter(et => {
        if (!nodesSearchQuery) return true
        const query = nodesSearchQuery.toLowerCase()
        return et.name.toLowerCase().includes(query) ||
               et.attributes.some(attr => attr.toLowerCase().includes(query))
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [analysis, nodesSearchQuery])

  const toggleNodeSelection = useCallback((elementName: string) => {
    setSelectedNodes(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(elementName)) {
        newSelected.delete(elementName)
      } else {
        newSelected.add(elementName)
      }
      return newSelected
    })
  }, [])

  const selectAllNodes = useCallback(() => {
    const allNames = new Set(allElementTypes.map(et => et.name))
    setSelectedNodes(allNames)
  }, [allElementTypes])

  const deselectAllNodes = useCallback(() => {
    setSelectedNodes(new Set())
  }, [])

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedKeys(prev => {
      const all = new Set(prev)
      // Would need tree structure to expand all - simplified for now
      return all
    })
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set())
  }, [])

  return {
    expandedKeys,
    setExpandedKeys,
    searchQuery,
    setSearchQuery,
    selectedNode,
    setSelectedNode,
    highlightedPath,
    setHighlightedPath,
    matchingPaths,
    setMatchingPaths,
    currentMatchIndex,
    setCurrentMatchIndex,
    visitedMatches,
    setVisitedMatches,
    activeTab,
    setActiveTab,
    selectedNodes,
    setSelectedNodes,
    nodesSearchQuery,
    setNodesSearchQuery,
    allElementTypes,
    toggleNodeSelection,
    selectAllNodes,
    deselectAllNodes,
    toggleExpand,
    expandAll,
    collapseAll,
    previousSearchQuery,
    highlightedNodeRef
  }
}

