'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import { xmlToJsonTree, type JsonTreeNode } from '../../utils/xmlToJsonTree'
import { getElementFactSheet, type ElementFactSheet } from '../../utils/xmlElementFactSheet'
import { XmlCodePreview, type XmlCodePreviewRef } from '../editor/XmlCodePreview'
import { useXmlTreeNavigation } from '../../hooks'
import { useXmlPanelResize } from '../../hooks/viewer/useXmlPanelResize'
import type { XmlAnalysisRules, XmlStructureAnalysis } from '../../services/xml/xmlAnalyzer'

// Sub-components
import { TreeNode } from './xml-tree/TreeNode'
import { NodesTab } from './xml-tree/NodesTab'
import { FactSheetPanel } from './xml-tree/FactSheetPanel'
import { TreeToolbar } from './xml-tree/TreeToolbar'

// Handlers
import { useXmlTreeHandlers } from './xml-tree/handlers/useXmlTreeHandlers'

interface XmlJsonTreeViewerProps {
  xmlString: string
  analysisRules?: Partial<XmlAnalysisRules>
  analysis?: XmlStructureAnalysis
  includedElements?: Set<string>
  onAddElements?: (elementNames: string[]) => void
  addingItems?: Set<string>
  onAddingItemsChange?: (items: Set<string>) => void
  className?: string
}

export function XmlJsonTreeViewer({
  xmlString,
  analysisRules,
  analysis,
  includedElements,
  onAddElements,
  addingItems: externalAddingItems,
  onAddingItemsChange,
  className
}: XmlJsonTreeViewerProps) {
  // Navigation and Resize Hooks
  const navigation = useXmlTreeNavigation(analysis)
  const panelResize = useXmlPanelResize()

  const {
    expandedKeys, setExpandedKeys,
    searchQuery, setSearchQuery,
    selectedNode, setSelectedNode,
    highlightedPath, setHighlightedPath,
    matchingPaths, setMatchingPaths,
    currentMatchIndex, setCurrentMatchIndex,
    setVisitedMatches,
    activeTab, setActiveTab,
    selectedNodes, setSelectedNodes,
    nodesSearchQuery, setNodesSearchQuery,
    allElementTypes,
    toggleNodeSelection,
    selectAllNodes,
    deselectAllNodes,
    toggleExpand,
    previousSearchQuery,
    highlightedNodeRef
  } = navigation

  const {
    isResizing,
    isResizingXml,
    isDetailsPanelOpen,
    isXmlPanelOpen,
    containerRef,
    resizeRef,
    xmlResizeRef,
    setIsDetailsPanelOpen,
    setIsXmlPanelOpen,
    panelWidths,
    handleMouseDown,
    handleXmlMouseDown
  } = panelResize

  const [factSheet, setFactSheet] = useState<ElementFactSheet | null>(null)
  const [internalAddingItems, setInternalAddingItems] = useState<Set<string>>(new Set())
  const addingItems = externalAddingItems ?? internalAddingItems
  const setAddingItems = onAddingItemsChange
    ? (items: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        if (items instanceof Set) {
          onAddingItemsChange(items)
        } else {
          onAddingItemsChange(items(internalAddingItems))
        }
      }
    : setInternalAddingItems
  
  const xmlEditorRef = useRef<XmlCodePreviewRef>(null)
  const [scrollToPosition] = useState<number | null>(null)

  const tree = useMemo(() => {
    return xmlToJsonTree(xmlString, analysisRules)
  }, [xmlString, analysisRules])

  const isElementIncluded = (elementName: string) => {
    return includedElements?.has(elementName) ?? false
  }

  // Centered handlers logic
  const handlers = useXmlTreeHandlers({
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
  })

  const {
    expandAll,
    collapseAll,
    handleBulkAddNodes,
    handleAddSingleNode,
    scrollToNodeInXml,
    navigateToMatch,
    handleNodeClick,
    handleShowFactSheet,
    onClearSearch
  } = handlers

  // Search result tracking Effect
  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) return tree
    const query = searchQuery.toLowerCase()
    const filterNode = (node: JsonTreeNode): JsonTreeNode | null => {
      const matches = node.key.toLowerCase().includes(query) ||
        (typeof node.value === 'string' && node.value.toLowerCase().includes(query))
      if (matches) return node
      if (node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter((child): child is JsonTreeNode => child !== null)
        if (filteredChildren.length > 0) return { ...node, children: filteredChildren }
      }
      return null
    }
    return filterNode(tree)
  }, [tree, searchQuery])

  useEffect(() => {
    if (!searchQuery.trim() || !tree) {
      previousSearchQuery.current = ''
      setHighlightedPath(null)
      setMatchingPaths([])
      setCurrentMatchIndex(-1)
      return
    }
    if (previousSearchQuery.current === searchQuery) return
    previousSearchQuery.current = searchQuery
    const query = searchQuery.toLowerCase()
    const matches: string[] = []
    const findMatches = (node: JsonTreeNode, path: string = '') => {
      const currentPath = path ? `${path}.${node.key}` : node.key
      if (node.key.toLowerCase().includes(query) || (typeof node.value === 'string' && node.value.toLowerCase().includes(query))) {
        matches.push(currentPath)
      }
      if (node.children) node.children.forEach((child) => findMatches(child, currentPath))
    }
    findMatches(tree)
    setMatchingPaths(matches)
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1)
    setVisitedMatches(new Set())
    if (matches.length > 0) {
      const firstMatch = matches[0]
      setHighlightedPath(firstMatch)
      setVisitedMatches(new Set([firstMatch]))
      setExpandedKeys(prev => {
        const newExpanded = new Set(prev)
        const parts = firstMatch.split('.')
        let accumulatedPath = ''
        parts.forEach((part) => {
          accumulatedPath = accumulatedPath ? `${accumulatedPath}.${part}` : part
          newExpanded.add(accumulatedPath)
        })
        return newExpanded
      })
      setTimeout(() => highlightedNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    } else {
      setHighlightedPath(null)
      setVisitedMatches(new Set())
    }
  }, [searchQuery, tree, highlightedNodeRef, previousSearchQuery, setCurrentMatchIndex, setExpandedKeys, setHighlightedPath, setMatchingPaths, setVisitedMatches])

  if (!tree) return <div className={cn('border rounded-lg p-4 bg-background', className)}><p className="text-xs text-muted-foreground">Unable to parse XML or XML is empty.</p></div>

  return (
    <div ref={containerRef} className={cn('border rounded-lg bg-background flex flex-col', className)} style={{ height: '655px', maxHeight: '655px' }}>
      <TreeToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isXmlPanelOpen={isXmlPanelOpen}
        setIsXmlPanelOpen={setIsXmlPanelOpen}
        isDetailsPanelOpen={isDetailsPanelOpen}
        setIsDetailsPanelOpen={setIsDetailsPanelOpen}
        expandedKeysSize={expandedKeys.size}
        expandAll={expandAll}
        collapseAll={collapseAll}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        matchingPaths={matchingPaths}
        currentMatchIndex={currentMatchIndex}
        goToPreviousMatch={() => navigateToMatch(currentMatchIndex <= 0 ? matchingPaths.length - 1 : currentMatchIndex - 1)}
        goToNextMatch={() => navigateToMatch((currentMatchIndex + 1) % matchingPaths.length)}
        onClearSearch={onClearSearch}
      />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(655px - 120px)', minHeight: 0 }}>
        {/* Left Panel - Tree or Nodes */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${panelWidths.tree}%`, minWidth: (isDetailsPanelOpen || isXmlPanelOpen) ? '200px' : '0' }}>
          <div className="overflow-y-auto overflow-x-hidden p-4 font-mono text-xs" style={{ height: '100%' }}>
            {activeTab === 'tree' ? (
              filteredTree ? (
                <TreeNode
                  node={filteredTree}
                  expandedKeys={expandedKeys}
                  toggleExpand={toggleExpand}
                  highlightedPath={highlightedPath}
                  visitedMatches={navigation.visitedMatches}
                  selectedNode={selectedNode}
                  factSheetElementName={factSheet?.elementName}
                  onAddElements={onAddElements}
                  isElementIncluded={isElementIncluded}
                  isXmlPanelOpen={isXmlPanelOpen}
                  scrollToNodeInXml={scrollToNodeInXml}
                  handleNodeClick={handleNodeClick}
                  onShowFactSheet={handleShowFactSheet}
                  highlightedNodeRef={highlightedNodeRef}
                />
              ) : (
                <p className="text-xs text-muted-foreground">No results found.</p>
              )
            ) : (
              <NodesTab
                allElementTypes={allElementTypes}
                selectedNodes={selectedNodes}
                nodesSearchQuery={nodesSearchQuery}
                setNodesSearchQuery={setNodesSearchQuery}
                toggleNodeSelection={toggleNodeSelection}
                selectAllNodes={selectAllNodes}
                deselectAllNodes={deselectAllNodes}
                handleBulkAddNodes={handleBulkAddNodes}
                handleAddSingleNode={handleAddSingleNode}
                isElementIncluded={isElementIncluded}
                addingItems={addingItems}
                factSheetElementName={factSheet?.elementName}
                onNodeClick={(name) => {
                  const data = getElementFactSheet(xmlString, '', name, analysisRules)
                  if (data) { setFactSheet(data); setSelectedNode({ path: '', key: name }); setIsDetailsPanelOpen(true) }
                }}
              />
            )}
          </div>
        </div>

        {/* Resize Handles and Other Panels */}
        {(isXmlPanelOpen || isDetailsPanelOpen) && (
          <div ref={resizeRef} className={cn('w-2 bg-muted/30 hover:bg-primary/30 border-l border-r border-border/50 cursor-col-resize transition-all duration-200 flex items-center justify-center group relative z-10', isResizing && 'bg-primary/40')} onMouseDown={handleMouseDown} style={{ minWidth: '8px' }} title="Drag to resize panels">
            <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
            <div className="flex flex-col items-center gap-1 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-0.5">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className={cn("w-1 h-1 rounded-full transition-colors", isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60")} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {isXmlPanelOpen && (
          <>
            <div className="flex flex-col overflow-hidden border-l" style={{ width: `${panelWidths.xml}%`, minWidth: '200px' }}>
              <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold">XML Source</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsXmlPanelOpen(false)} title="Close panel"><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
                <XmlCodePreview ref={xmlEditorRef} value={xmlString} height="100%" scrollToPosition={scrollToPosition} />
              </div>
            </div>

            {isDetailsPanelOpen && (
              <div ref={xmlResizeRef} className={cn('w-2 bg-muted/30 hover:bg-primary/30 border-l border-r border-border/50 cursor-col-resize transition-all duration-200 flex items-center justify-center group relative z-10', isResizingXml && 'bg-primary/40')} onMouseDown={handleXmlMouseDown} style={{ minWidth: '8px' }} title="Drag to resize panels">
                <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
                <div className="flex flex-col items-center gap-1 py-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-0.5">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className={cn("w-1 h-1 rounded-full transition-colors", isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60")} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isDetailsPanelOpen && (
          <div className="flex flex-col overflow-hidden border-l" style={{ width: `${panelWidths.details}%`, minWidth: '200px' }}>
            <FactSheetPanel
              factSheet={factSheet}
              analysis={analysis}
              onAddElements={onAddElements}
              isElementIncluded={isElementIncluded}
              addingItems={addingItems}
              isXmlPanelOpen={isXmlPanelOpen}
              hasSelectedNode={!!selectedNode}
              onLocateInXml={() => {
                if (selectedNode && tree) {
                  const findNode = (node: JsonTreeNode, path: string, key: string): JsonTreeNode | null => {
                    const currentPath = path ? `${path}.${node.key}` : node.key
                    if (currentPath === path && node.key === key) return node
                    if (node.children) {
                      for (const child of node.children) {
                        const childPath = node.type === 'array' ? `${currentPath}[${node.children.indexOf(child)}]` : `${currentPath}.${child.key}`
                        const found = findNode(child, childPath, key); if (found) return found
                      }
                    }
                    return null
                  }
                  const target = findNode(tree, selectedNode.path, selectedNode.key)
                  if (target) scrollToNodeInXml(target)
                }
              }}
              onClose={() => { setIsDetailsPanelOpen(false); setFactSheet(null); setSelectedNode(null) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
