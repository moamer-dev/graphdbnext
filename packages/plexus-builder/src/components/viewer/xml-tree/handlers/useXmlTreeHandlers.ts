'use client'

import { useCallback } from 'react'
import type { JsonTreeNode } from '../../../../utils/xmlToJsonTree'
import { getElementFactSheet, findElementPosition } from '../../../../utils/xmlElementFactSheet'
import type { XmlCodePreviewRef } from '../../../editor/XmlCodePreview'
import type { ElementFactSheet } from '../../../../utils/xmlElementFactSheet'
import type { XmlAnalysisRules } from '../../../../services/xml/xmlAnalyzer'

interface UseXmlTreeHandlersProps {
  xmlString: string
  analysisRules?: Partial<XmlAnalysisRules>
  tree: JsonTreeNode | null
  navigation: any
  panelResize: any
  xmlEditorRef: React.RefObject<XmlCodePreviewRef | null>
  onAddElements?: (elementNames: string[]) => void
  addingItems: Set<string>
  setAddingItems: (items: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setFactSheet: (sheet: ElementFactSheet | null) => void
}

export function useXmlTreeHandlers({
  xmlString,
  analysisRules,
  tree,
  navigation,
  panelResize,
  xmlEditorRef,
  onAddElements,
  addingItems,
  setAddingItems,
  setFactSheet
}: UseXmlTreeHandlersProps) {
  const {
    setExpandedKeys,
    setSelectedNode,
    setHighlightedPath,
    setMatchingPaths,
    setCurrentMatchIndex,
    setVisitedMatches,
    setSearchQuery,
    toggleExpand,
    highlightedNodeRef,
    matchingPaths,
    currentMatchIndex,
    selectedNodes,
    setSelectedNodes,
    selectedNode
  } = navigation as {
    setExpandedKeys: (keys: Set<string> | ((prev: Set<string>) => Set<string>)) => void
    setSelectedNode: (node: { path: string, key: string } | null) => void
    setHighlightedPath: (path: string | null) => void
    setMatchingPaths: (paths: string[]) => void
    setCurrentMatchIndex: (index: number) => void
    setVisitedMatches: (matches: Set<string> | ((prev: Set<string>) => Set<string>)) => void
    setSearchQuery: (query: string) => void
    toggleExpand: (path: string) => void
    highlightedNodeRef: React.RefObject<HTMLDivElement | null>
    matchingPaths: string[]
    currentMatchIndex: number
    selectedNodes: Set<string>
    setSelectedNodes: (nodes: Set<string>) => void
    selectedNode: { path: string, key: string } | null
  }

  const {
    isDetailsPanelOpen,
    setIsDetailsPanelOpen
  } = panelResize

  const expandAll = useCallback(() => {
    const allKeys = new Set<string>()
    const collectKeys = (node: JsonTreeNode, path: string = '') => {
      const currentPath = path ? `${path}.${node.key}` : node.key
      if (node.children && node.children.length > 0) {
        allKeys.add(currentPath)
        node.children.forEach((child, _index) => {
          collectKeys(child, node.type === 'array' ? `${currentPath}[${_index}]` : currentPath)
        })
      }
    }
    if (tree) collectKeys(tree)
    setExpandedKeys(allKeys)
  }, [tree, setExpandedKeys])

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set())
  }, [setExpandedKeys])

  const handleBulkAddNodes = useCallback(async () => {
    if (onAddElements && selectedNodes.size > 0 && addingItems.size === 0) {
      const itemsToAdd = Array.from(selectedNodes)
      setAddingItems(new Set(itemsToAdd))
      try {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            onAddElements(itemsToAdd)
            setSelectedNodes(new Set())
            resolve()
          }, 0)
        })
      } finally {
        setTimeout(() => setAddingItems(new Set()), 100)
      }
    }
  }, [onAddElements, selectedNodes, addingItems.size, setAddingItems, setSelectedNodes])

  const handleAddSingleNode = useCallback(async (elementName: string) => {
    if (onAddElements && !addingItems.has(elementName)) {
      setAddingItems(new Set([elementName]))
      try {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            onAddElements([elementName])
            resolve()
          }, 0)
        })
      } finally {
        setTimeout(() => {
          setAddingItems((prev: Set<string>) => {
            const next = new Set(prev)
            next.delete(elementName)
            return next
          })
        }, 100)
      }
    }
  }, [onAddElements, addingItems, setAddingItems])

  const scrollToNodeInXml = useCallback((node: JsonTreeNode) => {
    if (node.location) {
      const { xmlId, id, charPosition } = node.location
      if (xmlId && xmlEditorRef.current) {
        xmlEditorRef.current.scrollToId(xmlId)
        return
      }
      if (id && xmlEditorRef.current) {
        xmlEditorRef.current.scrollToId(id)
        return
      }
      if (charPosition !== undefined && charPosition !== null && xmlEditorRef.current) {
        xmlEditorRef.current.scrollToPosition(charPosition)
        return
      }
    }
    const nodePath = selectedNode?.path || ''
    const position = findElementPosition(xmlString, nodePath, node.key)
    if (position !== null && xmlEditorRef.current) {
      xmlEditorRef.current.scrollToPosition(position)
    }
  }, [xmlString, selectedNode, xmlEditorRef])

  const navigateToMatch = useCallback((index: number) => {
    if (index < 0 || index >= matchingPaths.length) return
    const matchPath = matchingPaths[index]
    setCurrentMatchIndex(index)
    setHighlightedPath(matchPath)
    setVisitedMatches((prev: Set<string>) => new Set([...prev, matchPath]))
    setExpandedKeys((prev: Set<string>) => {
      const newExpanded = new Set(prev)
      const parts = matchPath.split('.')
      let accumulatedPath = ''
      parts.forEach((part: string) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}.${part}` : part
        newExpanded.add(accumulatedPath)
      })
      return newExpanded
    })
    setTimeout(() => {
      highlightedNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [matchingPaths, setCurrentMatchIndex, setHighlightedPath, setVisitedMatches, setExpandedKeys, highlightedNodeRef])

  const handleNodeClick = useCallback((node: JsonTreeNode, currentPath: string, e: React.MouseEvent) => {
    if (node.key.startsWith('_') || node.key === '__text') return
    const isElementNode = !node.key.startsWith('_') && node.key !== '__text'
    if (node.children && node.children.length > 0) {
      toggleExpand(currentPath)
      if (isDetailsPanelOpen && isElementNode) {
        const data = getElementFactSheet(xmlString, currentPath, node.key, analysisRules)
        if (data) {
          setFactSheet(data)
          setSelectedNode({ path: currentPath, key: node.key })
        }
      }
    } else if (isDetailsPanelOpen && isElementNode) {
      const data = getElementFactSheet(xmlString, currentPath, node.key, analysisRules)
      if (data) {
        setFactSheet(data)
        setSelectedNode({ path: currentPath, key: node.key })
      }
    }
  }, [xmlString, analysisRules, isDetailsPanelOpen, setFactSheet, setSelectedNode, toggleExpand])

  const handleShowFactSheet = useCallback((node: JsonTreeNode, currentPath: string) => {
    const data = getElementFactSheet(xmlString, currentPath, node.key, analysisRules)
    if (data) {
      setSelectedNode({ path: currentPath, key: node.key })
      setFactSheet(data)
      setIsDetailsPanelOpen(true)
    }
  }, [xmlString, analysisRules, setSelectedNode, setFactSheet, setIsDetailsPanelOpen])

  const onClearSearch = useCallback(() => {
    setSearchQuery('')
    setMatchingPaths([])
    setCurrentMatchIndex(-1)
    setHighlightedPath(null)
    setVisitedMatches(new Set())
    setExpandedKeys(new Set())
  }, [setSearchQuery, setMatchingPaths, setCurrentMatchIndex, setHighlightedPath, setVisitedMatches, setExpandedKeys])

  return {
    expandAll,
    collapseAll,
    handleBulkAddNodes,
    handleAddSingleNode,
    scrollToNodeInXml,
    navigateToMatch,
    handleNodeClick,
    handleShowFactSheet,
    onClearSearch
  }
}
