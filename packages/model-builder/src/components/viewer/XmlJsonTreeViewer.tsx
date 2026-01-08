'use client'

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react'
import { ChevronRight, ChevronDown, Search, X, Info, GripVertical, ChevronLeft, ChevronRight as ChevronRightIcon, MapPin, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../utils/cn'
import { xmlToJsonTree, type JsonTreeNode } from '../../utils/xmlToJsonTree'
import { getElementFactSheet, type ElementFactSheet, findElementPosition } from '../../utils/xmlElementFactSheet'
import { DOMParser } from '@xmldom/xmldom'
import { Badge } from '../ui/badge'
import type { XmlAnalysisRules, XmlStructureAnalysis } from '../../services/xmlAnalyzer'
import { Plus, Check, CheckSquare, Square, Loader2 } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { XmlCodePreview, type XmlCodePreviewRef } from '../editor/XmlCodePreview'
import { Checkbox } from '../ui/checkbox'
import { useXmlTreeNavigation } from '../../hooks'
import { useXmlPanelResize } from '../../hooks/viewer/useXmlPanelResize'

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

export function XmlJsonTreeViewer ({
  xmlString,
  analysisRules,
  analysis,
  includedElements,
  onAddElements,
  addingItems: externalAddingItems,
  onAddingItemsChange,
  className
}: XmlJsonTreeViewerProps) {
  // Tree navigation hook
  const navigation = useXmlTreeNavigation(analysis)
  const expandedKeys = navigation.expandedKeys
  const setExpandedKeys = navigation.setExpandedKeys
  const searchQuery = navigation.searchQuery
  const setSearchQuery = navigation.setSearchQuery
  const selectedNode = navigation.selectedNode
  const setSelectedNode = navigation.setSelectedNode
  const highlightedPath = navigation.highlightedPath
  const setHighlightedPath = navigation.setHighlightedPath
  const matchingPaths = navigation.matchingPaths
  const setMatchingPaths = navigation.setMatchingPaths
  const currentMatchIndex = navigation.currentMatchIndex
  const setCurrentMatchIndex = navigation.setCurrentMatchIndex
  const visitedMatches = navigation.visitedMatches
  const setVisitedMatches = navigation.setVisitedMatches
  const activeTab = navigation.activeTab
  const setActiveTab = navigation.setActiveTab
  const selectedNodes = navigation.selectedNodes
  const setSelectedNodes = navigation.setSelectedNodes
  const nodesSearchQuery = navigation.nodesSearchQuery
  const setNodesSearchQuery = navigation.setNodesSearchQuery
  const allElementTypes = navigation.allElementTypes
  const toggleNodeSelection = navigation.toggleNodeSelection
  const selectAllNodes = navigation.selectAllNodes
  const deselectAllNodes = navigation.deselectAllNodes
  const toggleExpand = navigation.toggleExpand
  const previousSearchQuery = navigation.previousSearchQuery
  const highlightedNodeRef = navigation.highlightedNodeRef

  const [factSheet, setFactSheet] = useState<ElementFactSheet | null>(null)
  const [wrapWord, setWrapWord] = useState(false)
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
  const [scrollToPosition, setScrollToPosition] = useState<number | null>(null)

  const panelResize = useXmlPanelResize()
  const {
    leftWidth,
    xmlWidth,
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
  
  // Get element type info from analysis
  const getElementTypeInfo = (elementName: string) => {
    if (!analysis) return null
    return analysis.elementTypes.find(et => et.name.toLowerCase() === elementName.toLowerCase())
  }
  
  const isElementIncluded = (elementName: string) => {
    return includedElements?.has(elementName) ?? false
  }

  const handleBulkAddNodes = async () => {
    if (onAddElements && selectedNodes.size > 0 && addingItems.size === 0) {
      const itemsToAdd = Array.from(selectedNodes)
      setAddingItems(new Set(itemsToAdd))
      try {
        // Use setTimeout to allow UI to update
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            onAddElements(itemsToAdd)
            setSelectedNodes(new Set())
            resolve()
          }, 0)
        })
      } finally {
        // Small delay to ensure state updates are visible
        setTimeout(() => {
          setAddingItems(new Set())
        }, 100)
      }
    }
  }

  const handleAddSingleNode = async (elementName: string) => {
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
  }

  // Get fact sheet for an element type (from Nodes tab)
  const getFactSheetForElementType = (elementName: string) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlString, 'text/xml')

      // Check for parsing errors
      const parseError = doc.getElementsByTagName('parsererror')
      if (parseError.length > 0) {
        return null
      }

      // Find the first occurrence of this element
      const elements = doc.getElementsByTagName(elementName)
      if (elements.length === 0) {
        // Try case-insensitive search
        const allElements = doc.getElementsByTagName('*')
        for (let i = 0; i < allElements.length; i++) {
          const elem = allElements[i]
          if (elem.tagName && elem.tagName.toLowerCase() === elementName.toLowerCase()) {
            const element = elem as Element
            
            // Extract attributes
            const attributes: Array<{ name: string; value: string }> = []
            if (element.attributes) {
              for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i]
                attributes.push({
                  name: attr.name,
                  value: attr.value
                })
              }
            }

            // Extract children (grouped by name)
            const childrenMap = new Map<string, number>()
            const childElements = Array.from(element.childNodes).filter(
              (node) => node.nodeType === 1
            ) as Element[]
            
            childElements.forEach((child) => {
              const tagName = child.tagName?.toLowerCase() || ''
              childrenMap.set(tagName, (childrenMap.get(tagName) || 0) + 1)
            })

            const children = Array.from(childrenMap.entries()).map(([name, count]) => ({
              name,
              count
            }))

            // Extract parent
            const parent = element.parentNode && element.parentNode.nodeType === 1
              ? (element.parentNode as Element).tagName?.toLowerCase() || null
              : null

            // Extract ancestors
            const ancestors: string[] = []
            let current = element.parentNode
            while (current && current.nodeType === 1) {
              const ancestorName = (current as Element).tagName?.toLowerCase()
              if (ancestorName && ancestorName !== parent) {
                ancestors.unshift(ancestorName)
              }
              current = current.parentNode
            }

            // Extract text content
            const textNodes = Array.from(element.childNodes).filter(
              (node) => node.nodeType === 3
            ) as Text[]
            const textContent = textNodes
              .map((node) => node.textContent?.trim())
              .filter(Boolean)
              .join(' ') || null

            return {
              elementName: element.tagName?.toLowerCase() || elementName,
              attributes,
              children,
              parent,
              ancestors,
              textContent,
              hasTextContent: textContent !== null && textContent.length > 0,
              isArrayItem: false
            } as ElementFactSheet
          }
        }
        return null
      }

      // Use the first element found
      const element = elements[0] as Element

      // Extract attributes
      const attributes: Array<{ name: string; value: string }> = []
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i]
          attributes.push({
            name: attr.name,
            value: attr.value
          })
        }
      }

      // Extract children (grouped by name)
      const childrenMap = new Map<string, number>()
      const childElements = Array.from(element.childNodes).filter(
        (node) => node.nodeType === 1
      ) as Element[]
      
      childElements.forEach((child) => {
        const tagName = child.tagName?.toLowerCase() || ''
        childrenMap.set(tagName, (childrenMap.get(tagName) || 0) + 1)
      })

      const children = Array.from(childrenMap.entries()).map(([name, count]) => ({
        name,
        count
      }))

      // Extract parent
      const parent = element.parentNode && element.parentNode.nodeType === 1
        ? (element.parentNode as Element).tagName?.toLowerCase() || null
        : null

      // Extract ancestors
      const ancestors: string[] = []
      let current = element.parentNode
      while (current && current.nodeType === 1) {
        const ancestorName = (current as Element).tagName?.toLowerCase()
        if (ancestorName && ancestorName !== parent) {
          ancestors.unshift(ancestorName)
        }
        current = current.parentNode
      }

      // Extract text content
      const textNodes = Array.from(element.childNodes).filter(
        (node) => node.nodeType === 3
      ) as Text[]
      const textContent = textNodes
        .map((node) => node.textContent?.trim())
        .filter(Boolean)
        .join(' ') || null

      return {
        elementName: element.tagName?.toLowerCase() || elementName,
        attributes,
        children,
        parent,
        ancestors,
        textContent,
        hasTextContent: textContent !== null && textContent.length > 0,
        isArrayItem: false
      } as ElementFactSheet
    } catch (error) {
      console.error('Error getting fact sheet for element type:', error)
      return null
    }
  }

  const tree = useMemo(() => {
    return xmlToJsonTree(xmlString, analysisRules)
  }, [xmlString, analysisRules])

  const expandAll = () => {
    const allKeys = new Set<string>()
    const collectKeys = (node: JsonTreeNode, path: string = '') => {
      const currentPath = path ? `${path}.${node.key}` : node.key
      if (node.children && node.children.length > 0) {
        allKeys.add(currentPath)
        node.children.forEach((child, index) => {
          collectKeys(child, node.type === 'array' ? `${currentPath}[${index}]` : currentPath)
        })
      }
    }
    if (tree) {
      collectKeys(tree)
    }
    setExpandedKeys(allKeys)
  }

  const collapseAll = () => {
    setExpandedKeys(new Set())
  }


  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) {
      return tree
    }

    const query = searchQuery.toLowerCase()
    const filterNode = (node: JsonTreeNode): JsonTreeNode | null => {
      const matches = node.key.toLowerCase().includes(query) ||
        (typeof node.value === 'string' && node.value.toLowerCase().includes(query))

      if (matches) {
        return node
      }

      if (node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter((child): child is JsonTreeNode => child !== null)

        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          }
        }
      }

      return null
    }

    return filterNode(tree)
  }, [tree, searchQuery])

  // Find all matching nodes when search query changes
  useEffect(() => {
    if (!searchQuery.trim() || !tree) {
      previousSearchQuery.current = ''
      setHighlightedPath(null)
      setMatchingPaths([])
      setCurrentMatchIndex(-1)
      return
    }

    // Only update if search query actually changed
    if (previousSearchQuery.current === searchQuery) {
      return
    }

    previousSearchQuery.current = searchQuery
    const query = searchQuery.toLowerCase()
    
    // Find all matching nodes
    const matches: string[] = []
    const findMatches = (node: JsonTreeNode, path: string = '') => {
      const currentPath = path ? `${path}.${node.key}` : node.key
      const matchesQuery = node.key.toLowerCase().includes(query) ||
        (typeof node.value === 'string' && node.value.toLowerCase().includes(query))
      
      if (matchesQuery) {
        matches.push(currentPath)
      }
      
      // Continue searching children
      if (node.children) {
        node.children.forEach((child, index) => {
          const childPath = node.type === 'array'
            ? `${currentPath}[${index}]`
            : `${currentPath}.${child.key}`
          findMatches(child, currentPath)
        })
      }
    }
    
    findMatches(tree)
    setMatchingPaths(matches)
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1)
    setVisitedMatches(new Set()) // Reset visited matches on new search
    
    // Highlight and expand first match
    if (matches.length > 0) {
      const firstMatch = matches[0]
      setHighlightedPath(firstMatch)
      setVisitedMatches(new Set([firstMatch]))
      
      // Expand all ancestors of the first match
      setExpandedKeys(prev => {
        const newExpanded = new Set(prev)
        const parts = firstMatch.split('.')
        let accumulatedPath = ''
        parts.forEach((part) => {
          if (accumulatedPath) {
            accumulatedPath = `${accumulatedPath}.${part}`
          } else {
            accumulatedPath = part
          }
          newExpanded.add(accumulatedPath)
        })
        return newExpanded
      })
      
      // Scroll to highlighted node after a short delay
      setTimeout(() => {
        if (highlightedNodeRef.current) {
          highlightedNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } else {
      setHighlightedPath(null)
      setVisitedMatches(new Set())
    }
  }, [searchQuery, tree])

  // Navigate to specific match index
  const navigateToMatch = (index: number) => {
    if (index < 0 || index >= matchingPaths.length) return
    
    const matchPath = matchingPaths[index]
    setCurrentMatchIndex(index)
    setHighlightedPath(matchPath)
    
    // Add to visited matches
    setVisitedMatches(prev => new Set([...prev, matchPath]))
    
    // Expand all ancestors of the match
    setExpandedKeys(prev => {
      const newExpanded = new Set(prev)
      const parts = matchPath.split('.')
      let accumulatedPath = ''
      parts.forEach((part) => {
        if (accumulatedPath) {
          accumulatedPath = `${accumulatedPath}.${part}`
        } else {
          accumulatedPath = part
        }
        newExpanded.add(accumulatedPath)
      })
      return newExpanded
    })
    
    // Scroll to highlighted node after a short delay
    setTimeout(() => {
      if (highlightedNodeRef.current) {
        highlightedNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const goToNextMatch = () => {
    if (matchingPaths.length === 0) return
    const nextIndex = (currentMatchIndex + 1) % matchingPaths.length
    navigateToMatch(nextIndex)
  }

  const goToPreviousMatch = () => {
    if (matchingPaths.length === 0) return
    const prevIndex = currentMatchIndex <= 0 ? matchingPaths.length - 1 : currentMatchIndex - 1
    navigateToMatch(prevIndex)
  }

  const scrollToNodeInXml = (node: JsonTreeNode) => {
    console.log('scrollToNodeInXml called:', { nodeKey: node.key, location: node.location })
    
    // Use location data if available (most reliable)
    if (node.location) {
      const { xmlId, id, charPosition } = node.location
      
      // Prefer ID-based scrolling (most reliable)
      if (xmlId && xmlEditorRef.current) {
        console.log('Using xml:id for scrolling:', xmlId)
        xmlEditorRef.current.scrollToId(xmlId)
        return
      }
      
      if (id && xmlEditorRef.current) {
        console.log('Using id for scrolling:', id)
        xmlEditorRef.current.scrollToId(id)
        return
      }
      
      // Fallback to character position if available
      if (charPosition !== undefined && charPosition !== null && xmlEditorRef.current) {
        console.log('Using charPosition for scrolling:', charPosition)
        xmlEditorRef.current.scrollToPosition(charPosition)
        return
      }
    }
    
    // Fallback to old method if no location data
    console.log('Falling back to findElementPosition')
    const nodePath = selectedNode?.path || ''
    const position = findElementPosition(xmlString, nodePath, node.key)
    console.log('Found position:', position)
    if (position !== null && xmlEditorRef.current) {
      xmlEditorRef.current.scrollToPosition(position)
    } else {
      console.warn('Could not find position for element:', { nodePath, nodeKey: node.key })
    }
  }

  const handleNodeClick = (node: JsonTreeNode, currentPath: string, e: React.MouseEvent) => {
    // Don't show fact sheet for attributes or text nodes
    if (node.key.startsWith('_') || node.key === '__text') {
      return
    }

    // If clicking on info icon, always show fact sheet
    const target = e.target as HTMLElement
    if (target.closest('[data-info-icon]')) {
      e.stopPropagation()
      console.log('Info icon clicked:', { currentPath, nodeKey: node.key })
      const factSheetData = getElementFactSheet(xmlString, currentPath, node.key)
      console.log('Fact sheet data:', factSheetData)
      if (factSheetData) {
        setSelectedNode({ path: currentPath, key: node.key })
        setFactSheet(factSheetData)
        setIsDetailsPanelOpen(true) // Open panel when showing fact sheet
      } else {
        console.warn('Failed to get fact sheet for:', { currentPath, nodeKey: node.key })
      }
      return
    }

    // On regular click, toggle expand if expandable
    // If details panel is open, also show fact sheet for element nodes
    const isElementNode = !node.key.startsWith('_') && node.key !== '__text'
    
    if (node.children && node.children.length > 0) {
      toggleExpand(currentPath)
      // If details panel is open, show fact sheet for element nodes
      if (isDetailsPanelOpen && isElementNode) {
        const factSheetData = getElementFactSheet(xmlString, currentPath, node.key)
        if (factSheetData) {
          setSelectedNode({ path: currentPath, key: node.key })
          setFactSheet(factSheetData)
        }
      }
    } else {
      // For non-expandable nodes, show fact sheet if details panel is open
      if (isDetailsPanelOpen && isElementNode) {
        const factSheetData = getElementFactSheet(xmlString, currentPath, node.key)
        if (factSheetData) {
          setSelectedNode({ path: currentPath, key: node.key })
          setFactSheet(factSheetData)
        } else {
          console.warn('Failed to get fact sheet for:', { currentPath, nodeKey: node.key })
        }
      }
    }
  }

  const renderNode = (node: JsonTreeNode, depth: number = 0, path: string = ''): ReactNode => {
    if (!node) return null

    const currentPath = path ? `${path}.${node.key}` : node.key
    const isExpanded = expandedKeys.has(currentPath)
    const hasChildren = node.children && node.children.length > 0
    const isExpandable = hasChildren
    const isElementNode = !node.key.startsWith('_') && node.key !== '__text'

    const indent = depth * 20

    const isHighlighted = highlightedPath === currentPath
    const wasVisited = visitedMatches.has(currentPath) && !isHighlighted

    return (
      <div key={currentPath} className="select-none" ref={isHighlighted ? highlightedNodeRef : null}>
        <div
          className={cn(
            'flex items-center gap-1 py-0.5 hover:bg-muted/30 rounded cursor-pointer group',
            node.key.startsWith('_') && 'text-blue-600',
            node.key === '__text' && 'text-green-600',
            isHighlighted && 'bg-yellow-200 dark:bg-yellow-900/30',
            wasVisited && 'bg-yellow-100/50 dark:bg-yellow-900/15'
          )}
          style={{ paddingLeft: `${indent}px` }}
          onClick={(e) => handleNodeClick(node, currentPath, e)}
        >
          {isExpandable ? (
            <div className="h-4 w-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="w-4" />
          )}
          <span className="font-mono text-xs font-medium">{node.key}</span>
          {node.type === 'object' || node.type === 'array' ? (
            <span className="text-xs text-muted-foreground ml-1">
              {String(node.value)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground ml-2">
              : {typeof node.value === 'string' && node.value.length > 50
                ? `${node.value.substring(0, 50)}...`
                : String(node.value)}
            </span>
          )}
          {isElementNode && (
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onAddElements && !isElementIncluded(node.key) && (
                <button
                  className="p-0.5 hover:bg-muted rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddElements([node.key])
                  }}
                  title="Add to mapping"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {isElementIncluded(node.key) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Check className="h-2.5 w-2.5 inline" />
                </span>
              )}
              {isXmlPanelOpen && (
                <button
                  data-locate-icon
                  className="p-0.5 hover:bg-muted rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    scrollToNodeInXml(node)
                  }}
                  title="Locate in XML"
                >
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              <button
                data-info-icon
                className="p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  const factSheetData = getElementFactSheet(xmlString, currentPath, node.key)
                  if (factSheetData) {
                    setSelectedNode({ path: currentPath, key: node.key })
                    setFactSheet(factSheetData)
                    setIsDetailsPanelOpen(true) // Open panel when clicking info icon
                  }
                }}
                title="Show element details"
              >
                <Info className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child, index) => {
              const childPath = node.type === 'array'
                ? `${currentPath}[${index}]`
                : `${currentPath}.${child.key}`
              return renderNode(child, depth + 1, currentPath)
            })}
          </div>
        )}
      </div>
    )
  }

  if (!tree) {
    return (
      <div className={cn('border rounded-lg p-4 bg-background', className)}>
        <p className="text-xs text-muted-foreground">Unable to parse XML or XML is empty.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('border rounded-lg bg-background flex flex-col', className)} style={{ height: '655px', maxHeight: '655px', display: 'flex', flexDirection: 'column' }}>
      <div className="p-4 border-b bg-background flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          {/* <div>
            <h3 className="text-sm font-semibold">Document Tree</h3>
            {analysis && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {analysis.elementTypes.length} element types • {analysis.totalElements} total elements
                {includedElements && includedElements.size > 0 && ` • ${includedElements.size} in mapping`}
              </p>
            )}
          </div> */}
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 border rounded-md p-0.5 mr-2">
              <Button
                variant={activeTab === 'tree' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setActiveTab('tree')}
              >
                Tree
              </Button>
              <Button
                variant={activeTab === 'nodes' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setActiveTab('nodes')}
              >
                Nodes
              </Button>
            </div>
            <div className="flex items-center gap-1.5 border-r pr-2 mr-2">
              <Label htmlFor="show-xml" className="text-[12px] text-muted-foreground cursor-pointer" title="Show XML">
                XML
              </Label>
              <Switch
                id="show-xml"
                checked={isXmlPanelOpen}
                onCheckedChange={setIsXmlPanelOpen}
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5 border-r pr-2 mr-2">
              <Label htmlFor="show-details" className="text-[12px] text-muted-foreground cursor-pointer" title="Show Details">
                Details
              </Label>
              <Switch
                id="show-details"
                checked={isDetailsPanelOpen}
                onCheckedChange={setIsDetailsPanelOpen}
                className="scale-75"
              />
            </div>
            {activeTab === 'tree' && (
              <div className="flex items-center gap-1.5">
                {expandedKeys.size > 0 ? (
                  <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronsDownUp className="h-3 w-3 text-muted-foreground" />
                )}
                <Switch
                  id="expand-collapse-tree"
                  checked={expandedKeys.size > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      expandAll()
                    } else {
                      collapseAll()
                    }
                  }}
                  className="scale-75"
                  title={expandedKeys.size > 0 ? 'Collapse All' : 'Expand All'}
                />
              </div>
            )}
          </div>
        </div>
        {activeTab === 'tree' && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in tree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-8 h-8 text-xs",
                matchingPaths.length > 0 ? "pr-32" : "pr-8"
              )}
            />
          {searchQuery && matchingPaths.length > 0 && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">
                {currentMatchIndex + 1} / {matchingPaths.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={goToPreviousMatch}
                title="Previous match"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={goToNextMatch}
                title="Next match"
              >
                <ChevronRightIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              onClick={() => {
                setSearchQuery('')
                setMatchingPaths([])
                setCurrentMatchIndex(-1)
                setHighlightedPath(null)
                setVisitedMatches(new Set())
                // Clear all expanded keys related to search
                setExpandedKeys(new Set())
              }}
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {searchQuery && matchingPaths.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setSearchQuery('')
                setMatchingPaths([])
                setCurrentMatchIndex(-1)
                setHighlightedPath(null)
                setVisitedMatches(new Set())
              }}
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          </div>
        )}
        {activeTab === 'nodes' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search nodes..."
                value={nodesSearchQuery}
                onChange={(e) => setNodesSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs"
              />
              {nodesSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setNodesSearchQuery('')}
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={selectAllNodes}
                disabled={allElementTypes.length === 0}
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={deselectAllNodes}
                disabled={selectedNodes.size === 0}
              >
                <Square className="h-3 w-3 mr-1" />
                Deselect All
              </Button>
              {selectedNodes.size > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-6 px-2 text-xs ml-auto"
                  onClick={handleBulkAddNodes}
                  disabled={addingItems.size > 0}
                >
                  {addingItems.size > 0 ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Adding {addingItems.size}...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add {selectedNodes.size} to Mapping
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Split Pane Container - Fixed height scrollable area */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(655px - 120px)', minHeight: 0 }}>
        {/* Left Panel - JSON Tree or Nodes */}
        <div 
          className="flex flex-col overflow-hidden"
          style={{ 
            width: `${panelWidths.tree}%`,
            minWidth: (isDetailsPanelOpen || isXmlPanelOpen) ? '200px' : '0'
          }}
        >
          <div 
            className="overflow-y-auto overflow-x-hidden p-4 font-mono text-xs" 
            style={{ 
              height: '100%'
            }}
          >
            {activeTab === 'tree' ? (
              filteredTree ? (
                <>{renderNode(filteredTree)}</>
              ) : (
                <p className="text-xs text-muted-foreground">No results found.</p>
              )
            ) : (
              <div className="space-y-1">
                {allElementTypes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {nodesSearchQuery ? 'No nodes found matching your search.' : 'No element types available.'}
                  </p>
                ) : (
                  allElementTypes.map((elementType) => {
                    const isSelected = selectedNodes.has(elementType.name)
                    const isIncluded = isElementIncluded(elementType.name)
                    const canAdd = !isIncluded && onAddElements
                    const isAdding = addingItems.has(elementType.name)

                    return (
                      <div
                        key={elementType.name}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer',
                          isSelected && 'bg-primary/10 border-primary/50',
                          !isSelected && 'hover:bg-muted/50',
                          isIncluded && 'opacity-60',
                          isAdding && 'opacity-80'
                        )}
                        onClick={(e) => {
                          // Don't trigger if clicking on checkbox or add button
                          if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
                            return
                          }
                          const factSheetData = getFactSheetForElementType(elementType.name)
                          if (factSheetData) {
                            setFactSheet(factSheetData)
                            setIsDetailsPanelOpen(true)
                          }
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleNodeSelection(elementType.name)}
                          disabled={isIncluded || isAdding}
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono font-medium">{elementType.name}</code>
                            {isIncluded && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                <Check className="h-2.5 w-2.5 mr-0.5" />
                                In Mapping
                              </Badge>
                            )}
                            {isAdding && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                                Adding...
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{elementType.count} instances</span>
                            {elementType.attributes.length > 0 && (
                              <span>{elementType.attributes.length} attributes</span>
                            )}
                            {elementType.children.length > 0 && (
                              <span>{elementType.children.length} child types</span>
                            )}
                          </div>
                        </div>
                        {canAdd && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddSingleNode(elementType.name)
                            }}
                            title="Add to mapping"
                            disabled={isAdding}
                          >
                            {isAdding ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle - Between Tree and XML/Details */}
        {(isXmlPanelOpen || isDetailsPanelOpen) && (
          <div
            ref={resizeRef}
            className={cn(
              'w-2 bg-muted/30 hover:bg-primary/30 border-l border-r border-border/50 cursor-col-resize transition-all duration-200 flex items-center justify-center group relative z-10',
              isResizing && 'bg-primary/40'
            )}
            onMouseDown={handleMouseDown}
            style={{ minWidth: '8px' }}
            title="Drag to resize panels"
          >
            <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
            <div className="flex flex-col items-center gap-1 py-2">
              <div className="flex gap-0.5">
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
              </div>
              <div className="flex gap-0.5">
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
              </div>
              <div className="flex gap-0.5">
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
                <div className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isResizing ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                )} />
              </div>
            </div>
          </div>
        )}

        {/* Middle Panel - XML */}
        {isXmlPanelOpen && (
          <>
            <div 
              className="flex flex-col overflow-hidden border-l"
              style={{ width: `${panelWidths.xml}%`, minWidth: '200px' }}
            >
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">XML Source</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 border-r pr-2 mr-2">
                      <Label htmlFor="wrap-word" className="text-xs text-muted-foreground cursor-pointer">
                        Wrap Word
                      </Label>
                      <Switch
                        id="wrap-word"
                        checked={wrapWord}
                        onCheckedChange={setWrapWord}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsXmlPanelOpen(false)}
                      title="Close panel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div 
                className="flex-1 overflow-y-auto overflow-x-auto" 
                style={{ 
                  minHeight: 0,
                  height: '100%'
                }}
              >
                <XmlCodePreview 
                  ref={xmlEditorRef}
                  value={xmlString} 
                  height="100%" 
                  wrapWord={wrapWord}
                  scrollToPosition={scrollToPosition}
                />
              </div>
            </div>

            {/* Resize Handle - Between XML and Details */}
            {isDetailsPanelOpen && (
              <div
                ref={xmlResizeRef}
                className={cn(
                  'w-2 bg-muted/30 hover:bg-primary/30 border-l border-r border-border/50 cursor-col-resize transition-all duration-200 flex items-center justify-center group relative z-10',
                  isResizingXml && 'bg-primary/40'
                )}
                onMouseDown={handleXmlMouseDown}
                style={{ minWidth: '8px' }}
                title="Drag to resize panels"
              >
                <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
                <div className="flex flex-col items-center gap-1 py-2">
                  <div className="flex gap-0.5">
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                  </div>
                  <div className="flex gap-0.5">
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                  </div>
                  <div className="flex gap-0.5">
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      isResizingXml ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-primary/60"
                    )} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Right Panel - Fact Sheet */}
        {isDetailsPanelOpen && (
          <div 
            className="flex flex-col overflow-hidden border-l"
            style={{ width: `${panelWidths.details}%`, minWidth: '200px' }}
          >
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Element Details
                </h3>
                <div className="flex items-center gap-2">
                  {analysis && (
                    <div className="text-xs text-muted-foreground">
                      {analysis.elementTypes.length} types • {analysis.totalElements} elements
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setIsDetailsPanelOpen(false)
                      setFactSheet(null)
                      setSelectedNode(null)
                    }}
                    title="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div 
              className="overflow-y-auto overflow-x-hidden p-4 flex-1" 
              style={{ 
                minHeight: 0
              }}
            >
              {!factSheet ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click on any element node to view its details
                </div>
              ) : (
                <div className="space-y-4">
              {/* Element Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Element Name</h4>
                  {onAddElements && !isElementIncluded(factSheet.elementName) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAddSingleNode(factSheet.elementName)}
                      disabled={addingItems.has(factSheet.elementName)}
                    >
                      {addingItems.has(factSheet.elementName) ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Mapping
                        </>
                      )}
                    </Button>
                  )}
                  {isElementIncluded(factSheet.elementName) && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      In Mapping
                    </Badge>
                  )}
                  {isXmlPanelOpen && selectedNode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (selectedNode && tree) {
                          // Find the node in the tree
                          const findNode = (node: JsonTreeNode, path: string, key: string): JsonTreeNode | null => {
                            const currentPath = path ? `${path}.${node.key}` : node.key
                            if (currentPath === path && node.key === key) {
                              return node
                            }
                            if (node.children) {
                              for (const child of node.children) {
                                const childPath = node.type === 'array'
                                  ? `${currentPath}[${node.children.indexOf(child)}]`
                                  : `${currentPath}.${child.key}`
                                const found = findNode(child, childPath, key)
                                if (found) return found
                              }
                            }
                            return null
                          }
                          const targetNode = findNode(tree, selectedNode.path, selectedNode.key)
                          if (targetNode) {
                            scrollToNodeInXml(targetNode)
                          }
                        }
                      }}
                      title="Locate in XML"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Locate in XML
                    </Button>
                  )}
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <code className="text-sm font-mono">{factSheet.elementName}</code>
                  {factSheet.isArrayItem && factSheet.arrayIndex !== undefined && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Array Index: {factSheet.arrayIndex}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Element Type Statistics */}
              {analysis && (() => {
                const elementType = getElementTypeInfo(factSheet.elementName)
                if (!elementType) return null
                return (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Type Statistics</h4>
                    <div className="bg-muted/50 p-2 rounded space-y-1">
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">Total Instances:</span>
                        <span className="font-mono font-medium">{elementType.count}</span>
                      </div>
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">Attributes:</span>
                        <span className="font-mono font-medium">{elementType.attributes.length}</span>
                      </div>
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">Child Types:</span>
                        <span className="font-mono font-medium">{elementType.children.length}</span>
                      </div>
                      {elementType.hasTextContent && (
                        <div className="text-xs text-muted-foreground italic">
                          Contains text content
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

                {/* Attributes */}
                {factSheet.attributes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Attributes ({factSheet.attributes.length})</h4>
                    <div className="space-y-1">
                      {factSheet.attributes.map((attr, idx) => (
                        <div key={idx} className="bg-muted/50 p-2 rounded flex items-center gap-2">
                          <code className="text-xs font-mono text-blue-600">{attr.name}</code>
                          <span className="text-xs text-muted-foreground">=</span>
                          <span className="text-xs">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Children */}
                {factSheet.children.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Children ({factSheet.children.length} types)</h4>
                    <div className="flex flex-wrap gap-2">
                      {factSheet.children.map((child, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <code className="font-mono">{child.name}</code>
                          {child.count > 1 && (
                            <span className="ml-1 text-muted-foreground">({child.count})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parent */}
                {factSheet.parent && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Parent Element</h4>
                    <div className="bg-muted/50 p-2 rounded">
                      <code className="text-sm font-mono">{factSheet.parent}</code>
                    </div>
                  </div>
                )}

                {/* Ancestors */}
                {factSheet.ancestors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Ancestors ({factSheet.ancestors.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {factSheet.ancestors.map((ancestor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <code className="font-mono">{ancestor}</code>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                {factSheet.hasTextContent && factSheet.textContent && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Text Content</h4>
                    <div className="bg-muted/50 p-2 rounded">
                      <p className="text-xs whitespace-pre-wrap break-words">
                        {factSheet.textContent.length > 500
                          ? `${factSheet.textContent.substring(0, 500)}...`
                          : factSheet.textContent}
                      </p>
                      {factSheet.textContent.length > 500 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (Truncated - {factSheet.textContent.length} characters total)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!factSheet.hasTextContent && factSheet.children.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">
                    This element has no text content or children.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

      </div>
    </div>
  )
}

