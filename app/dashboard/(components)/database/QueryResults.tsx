'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Database, FileText, ChevronLeft, ChevronRight, Search, X, Table2, Network, Share2, Check, Save, Edit2, Trash2, Plus, Download, Image, Palette, Settings2 } from 'lucide-react'
import { GraphView } from './GraphView'
import type { VisualizationConfig } from '@/lib/services/CustomVisualizationService'
import { TableCellEditor } from './TableCellEditor'
import { CreateNodeDialog } from './CreateNodeDialog'
import { useQueryResults } from '../../hooks/query/useQueryResults'
import { useMutation } from '../../hooks/database/useMutation'
import { NodeQueries, CommonQueries } from '@/lib/queries/cypherQueries'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useExport } from '../../hooks/export/useExport'
import { useGraphExport } from '../../hooks/export/useGraphExport'
import { GraphVisualizationService } from '@/lib/services/GraphVisualizationService'
import { Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const DEFAULT_NODE_COLORS = {
  Word: '#3b82f6',
  Seg: '#10b981',
  Sign: '#f59e0b',
  Character: '#ef4444',
  Phrase: '#8b5cf6',
  Part: '#ec4899',
  Line: '#06b6d4',
  Surface: '#14b8a6',
  Column: '#f97316'
} as const

interface QueryResultsProps {
  results: unknown[] | null
  loading?: boolean
  currentQuery?: string
  onRefresh?: () => void
}

export function QueryResults({ results, loading, currentQuery, onRefresh }: QueryResultsProps) {
  const {
    viewMode,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm,
    columnFilters,
    visibleColumns,
    copied,
    saveDialogOpen,
    setSaveDialogOpen,
    saveFormData,
    setSaveFormData,
    allKeys,
    aliasToLabel,
    filteredResults,
    totalPages,
    startIndex,
    endIndex,
    paginatedResults,
    hasActiveFilters,
    handleViewModeChange,
    handleShare,
    handleOpenSaveDialog,
    handleSaveQuery,
    handleColumnFilter,
    clearFilters
  } = useQueryResults({ results, loading, currentQuery })

  const [editingCell, setEditingCell] = useState<{ rowIdx: number, key: string, property?: string } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, rowIdx: number | null, type: 'node' | 'relationship' | null, id: number | null, label?: string }>({ open: false, rowIdx: null, type: null, id: null })
  const [cascadeDelete, setCascadeDelete] = useState(false)
  const [outgoingRelationshipsCount, setOutgoingRelationshipsCount] = useState<number | null>(null)
  const [createNodeDialogOpen, setCreateNodeDialogOpen] = useState(false)
  const { updateNodeProperties, updateRelationshipProperties, deleteNode, deleteRelationship, isSaving } = useMutation()
  const { exporting, exportToCSV, exportToJSON, exportToGraphML } = useExport()
  const { exporting: exportingGraph, exportToPNG, exportToSVG } = useGraphExport()
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [visualizationConfig, setVisualizationConfig] = useState<VisualizationConfig>({
    layout: 'force'
  })
  const [showVisualizationSettings, setShowVisualizationSettings] = useState(false)
  const [activeGraphData, setActiveGraphData] = useState<{ nodes: any[], edges: any[] } | null>(null)

  const handleGraphDataChange = useCallback((data: { nodes: any[], edges: any[] } | null) => {
    setActiveGraphData(data)
  }, [])

  // Reset active graph data when results change or view mode changes
  useEffect(() => {
    setActiveGraphData(null)
  }, [results, viewMode])

  // Helper to check if a value is a node object
  const isNodeObject = (value: unknown): value is { id: number, labels: string[], properties: Record<string, unknown> } => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'labels' in value &&
      Array.isArray((value as { labels: unknown }).labels)
    )
  }

  // Helper to check if a value is a relationship object
  const isRelationshipObject = (value: unknown): value is { id: number, type: string, start: number, end: number, properties: Record<string, unknown> } => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'type' in value &&
      'start' in value &&
      'end' in value
    )
  }

  // Extract all node IDs from a row
  const extractNodeIdsFromRow = useCallback((row: Record<string, unknown>): Array<{ id: number, column: string, labels: string[] }> => {
    const nodes: Array<{ id: number, column: string, labels: string[] }> = []
    for (const [key, value] of Object.entries(row)) {
      if (isNodeObject(value)) {
        nodes.push({ id: value.id, column: key, labels: value.labels })
      }
    }
    return nodes
  }, [])

  // Extract all relationship IDs from a row
  const extractRelationshipIdsFromRow = useCallback((row: Record<string, unknown>): Array<{ id: number, column: string, type: string }> => {
    const relationships: Array<{ id: number, column: string, type: string }> = []
    for (const [key, value] of Object.entries(row)) {
      if (isRelationshipObject(value)) {
        relationships.push({ id: value.id, column: key, type: value.type })
      }
    }
    return relationships
  }, [])

  // Legacy methods for backward compatibility (return first match)
  const extractNodeIdFromRow = useCallback((row: Record<string, unknown>): number | null => {
    const nodes = extractNodeIdsFromRow(row)
    return nodes.length > 0 ? nodes[0].id : null
  }, [extractNodeIdsFromRow])

  const extractRelationshipIdFromRow = useCallback((row: Record<string, unknown>): number | null => {
    const relationships = extractRelationshipIdsFromRow(row)
    return relationships.length > 0 ? relationships[0].id : null
  }, [extractRelationshipIdsFromRow])

  // Check if a column key refers to a property of a node/relationship in the row
  const getEntityInfo = useCallback((row: Record<string, unknown>, key: string, propertyKey?: string): { type: 'node' | 'relationship' | null, id: number | null, property: string, canEdit: boolean } => {
    // Check if the column value itself is a node or relationship
    const cellValue = row[key]

    if (isNodeObject(cellValue)) {
      // This cell contains a node object - if propertyKey is provided, we're editing a property within the node
      if (propertyKey) {
        return { type: 'node', id: cellValue.id, property: propertyKey, canEdit: true }
      }
      // Can't edit the node object itself, but properties within it are editable
      return { type: 'node', id: cellValue.id, property: key, canEdit: false }
    }

    if (isRelationshipObject(cellValue)) {
      // This cell contains a relationship object - same logic
      if (propertyKey) {
        return { type: 'relationship', id: cellValue.id, property: propertyKey, canEdit: true }
      }
      return { type: 'relationship', id: cellValue.id, property: key, canEdit: false }
    }

    // Check if there's a node object in the row (this column might be a property reference)
    const nodeId = extractNodeIdFromRow(row)
    if (nodeId !== null) {
      // For simple properties, we assume they belong to the node if there's a node in the row
      // This works when the query returns something like: MATCH (n:Label) RETURN n, n.property AS prop
      return { type: 'node', id: nodeId, property: key, canEdit: true }
    }

    // Check if there's a relationship object in the row
    const relId = extractRelationshipIdFromRow(row)
    if (relId !== null) {
      return { type: 'relationship', id: relId, property: key, canEdit: true }
    }

    return { type: null, id: null, property: key, canEdit: false }
  }, [extractNodeIdFromRow, extractRelationshipIdFromRow])

  const handleCellEdit = useCallback((rowIdx: number, key: string, property?: string) => {
    setEditingCell({ rowIdx, key, property })
  }, [])

  // Helper to deeply compare two values
  const valuesEqual = useCallback((val1: unknown, val2: unknown): boolean => {
    if (val1 === val2) return true
    if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
      return val1 === val2
    }
    if (typeof val1 !== typeof val2) return false

    // For objects and arrays, do a deep comparison via JSON
    if (typeof val1 === 'object') {
      try {
        return JSON.stringify(val1) === JSON.stringify(val2)
      } catch {
        // If JSON.stringify fails, fall back to reference equality
        return val1 === val2
      }
    }

    return false
  }, [])

  const handleCellSave = useCallback(async (rowIdx: number, key: string, newValue: unknown, propertyKey?: string) => {
    if (!paginatedResults || rowIdx >= paginatedResults.length) return

    const row = paginatedResults[rowIdx] as Record<string, unknown>
    const entityInfo = getEntityInfo(row, key, propertyKey)
    const actualProperty = propertyKey || entityInfo.property

    if (!entityInfo.canEdit || !entityInfo.type || !entityInfo.id) {
      console.warn('Cannot edit this cell or determine entity type/ID for cell edit')
      setEditingCell(null)
      return
    }

    const cellValue = row[key]
    let originalValue = row[key]
    if (propertyKey && isNodeObject(cellValue)) {
      originalValue = (cellValue as { properties: Record<string, unknown> }).properties[propertyKey]
    } else if (propertyKey && isRelationshipObject(cellValue)) {
      originalValue = (cellValue as { properties: Record<string, unknown> }).properties[propertyKey]
    }

    // Check if value has actually changed
    if (valuesEqual(newValue, originalValue)) {
      // Value hasn't changed, just close the editor without executing a query
      setEditingCell(null)
      return
    }

    const success = entityInfo.type === 'node'
      ? await updateNodeProperties(entityInfo.id, [{
        property: actualProperty,
        value: newValue,
        originalValue
      }])
      : await updateRelationshipProperties(entityInfo.id, [{
        property: actualProperty,
        value: newValue,
        originalValue
      }])

    if (success) {
      setEditingCell(null)
      onRefresh?.()
    }
  }, [paginatedResults, updateNodeProperties, updateRelationshipProperties, onRefresh, getEntityInfo, valuesEqual])

  const handleCellCancel = useCallback(() => {
    setEditingCell(null)
  }, [])

  const handleDeleteClick = useCallback((rowIdx: number, entityType: 'node' | 'relationship', entityId: number, label?: string) => {
    setDeleteDialog({ open: true, rowIdx, type: entityType, id: entityId, label })
  }, [])

  // Query database for outgoing relationships when delete dialog opens for a node
  useEffect(() => {
    if (!deleteDialog.open || !deleteDialog.type || deleteDialog.type !== 'node' || !deleteDialog.id) {
      return
    }

    let cancelled = false

    const checkOutgoingRelationships = async () => {
      try {
        const nodeId = deleteDialog.id
        if (!nodeId) return

        // Query to count outgoing relationships (where this node is the source)
        const query = NodeQueries.countOutgoingRelationships(nodeId)

        const response = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const data = await response.json()
        if (cancelled) return

        if (data.success && data.results && data.results.length > 0) {
          const count = data.results[0].count as number || 0
          setOutgoingRelationshipsCount(count)
        } else {
          setOutgoingRelationshipsCount(0)
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error checking outgoing relationships:', error)
        setOutgoingRelationshipsCount(0)
      }
    }

    checkOutgoingRelationships()

    return () => {
      cancelled = true
    }
  }, [deleteDialog.open, deleteDialog.type, deleteDialog.id])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog.id || !deleteDialog.type) return

    let success = false
    if (deleteDialog.type === 'node') {
      const connectedCount = outgoingRelationshipsCount !== null ? outgoingRelationshipsCount : 0
      success = await deleteNode(deleteDialog.id, connectedCount > 0, cascadeDelete)
    } else if (deleteDialog.type === 'relationship') {
      success = await deleteRelationship(deleteDialog.id)
    }

    if (success) {
      // Trigger node labels refresh event if a node was deleted
      if (deleteDialog.type === 'node') {
        window.dispatchEvent(new CustomEvent('nodeLabelsChanged'))
      }
      setDeleteDialog({ open: false, rowIdx: null, type: null, id: null, label: undefined })
      setCascadeDelete(false)
      setOutgoingRelationshipsCount(null)
      onRefresh?.()
    }
  }, [deleteDialog, deleteNode, deleteRelationship, cascadeDelete, outgoingRelationshipsCount, onRefresh])

  if (loading) {
    return (
      <div className="h-full flex flex-col gradient-section rounded-lg border border-border/20">
        <div className="gradient-header-minimal p-4">
          <h2 className="text-base font-semibold">Query Results</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Executing query...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div className="h-full flex flex-col gradient-section rounded-lg border border-border/20">
        <div className="gradient-header-minimal p-4">
          <h2 className="text-base font-semibold">Query Results</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No results found</p>
          </div>
        </div>
      </div>
    )
  }

  // Format value for display with editing support
  const formatValue = (value: unknown, rowIdx?: number, columnKey?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>
    }

    if (typeof value === 'object') {
      // Handle node objects
      if ('id' in (value as Record<string, unknown>) && 'labels' in (value as Record<string, unknown>)) {
        const node = value as { id: number, labels: string[], properties: Record<string, unknown> }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Node</Badge>
              <span className="text-xs font-mono">ID: {node.id}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {node.labels.map(label => (
                <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
              ))}
            </div>
            {Object.keys(node.properties).length > 0 && (
              <details className="text-xs mt-1" open>
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Properties ({Object.keys(node.properties).length})
                </summary>
                <div className="mt-1 p-2 bg-muted rounded space-y-1">
                  {Object.entries(node.properties).map(([propKey, propValue]) => {
                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.key === columnKey && editingCell?.property === propKey
                    return (
                      <div key={propKey} className="flex items-center gap-2 group/prop text-xs">
                        <span className="font-mono text-muted-foreground min-w-[100px]">{propKey}:</span>
                        {isEditing ? (
                          <TableCellEditor
                            value={propValue}
                            onSave={(newValue) => {
                              if (rowIdx !== undefined && columnKey) {
                                handleCellSave(rowIdx, columnKey, newValue, propKey)
                              }
                            }}
                            onCancel={handleCellCancel}
                          />
                        ) : (
                          <div className="flex-1 flex items-center justify-between group/value">
                            <span className="font-medium">{typeof propValue === 'object' ? JSON.stringify(propValue) : String(propValue)}</span>
                            {rowIdx !== undefined && columnKey && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (rowIdx !== undefined && columnKey) {
                                    setEditingCell({ rowIdx, key: columnKey, property: propKey })
                                  }
                                }}
                                className="h-5 w-5 p-0 opacity-0 group-hover/value:opacity-100 transition-opacity ml-2"
                                title={`Edit ${propKey}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
          </div>
        )
      }

      // Handle relationship objects
      if ('type' in (value as Record<string, unknown>) && 'start' in (value as Record<string, unknown>)) {
        const rel = value as { id: number, type: string, start: number, end: number, properties: Record<string, unknown> }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Relationship</Badge>
              <span className="text-xs font-mono">{rel.type}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {rel.start} → {rel.end}
            </div>
            {Object.keys(rel.properties).length > 0 && (
              <details className="text-xs mt-1">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Properties
                </summary>
                <div className="mt-1 p-2 bg-muted rounded">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(rel.properties, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return (
          <div className="text-xs">
            <Badge variant="outline" className="text-xs mb-1">Array ({value.length})</Badge>
            <details>
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View items
              </summary>
              <div className="mt-1 p-2 bg-muted rounded max-h-32 overflow-auto">
                {value.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    {JSON.stringify(item)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )
      }

      // Generic object
      return (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Object
          </summary>
          <div className="mt-1 p-2 bg-muted rounded">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </details>
      )
    }

    if (typeof value === 'string') {
      return <span className="text-xs font-mono">{value}</span>
    }

    if (typeof value === 'number') {
      return <span className="text-xs font-mono">{value}</span>
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'} className="text-xs">{String(value)}</Badge>
    }

    return <span className="text-xs">{String(value)}</span>
  }


  return (
    <div className="h-full flex flex-col gradient-section rounded-lg border border-border/20">
      <div className="gradient-header-minimal p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Query Results</h2>
            {viewMode === 'table' && totalPages > 1 && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
                {hasActiveFilters && ` (filtered from ${results.length} total)`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Create Node Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateNodeDialogOpen(true)}
              className="h-7 text-xs px-2 border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Node
            </Button>
            {/* Save Button */}
            {currentQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                className="h-7 text-xs px-2 border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting || exportingGraph}
                  className="h-7 text-xs px-2 border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                >
                  {exporting || exportingGraph ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {viewMode === 'table' ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => exportToCSV(filteredResults, `query-results-${Date.now()}.csv`)}
                      disabled={exporting}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      Export to CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => exportToJSON(filteredResults, `query-results-${Date.now()}.json`)}
                      disabled={exporting}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      Export to JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        const visualizationService = new GraphVisualizationService()
                        const graphData = visualizationService.extractGraphData(filteredResults)
                        await exportToGraphML(graphData.nodes, graphData.edges, `query-results-${Date.now()}.graphml`)
                      }}
                      disabled={exporting}
                    >
                      <Network className="h-3 w-3 mr-2" />
                      Export to GraphML
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={async () => {
                        const svgElement = graphContainerRef.current?.querySelector('svg')
                        if (svgElement) {
                          await exportToPNG(svgElement, `graph-${Date.now()}.png`, {
                            format: 'png',
                            width: 1920,
                            height: 1080
                          })
                        } else {
                          toast.error('Graph not found. Please wait for it to load.')
                        }
                      }}
                      disabled={exportingGraph}
                    >
                      <Image className="h-3 w-3 mr-2" />
                      Export to PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        const svgElement = graphContainerRef.current?.querySelector('svg')
                        if (svgElement) {
                          await exportToSVG(svgElement, `graph-${Date.now()}.svg`)
                        } else {
                          toast.error('Graph not found. Please wait for it to load.')
                        }
                      }}
                      disabled={exportingGraph}
                    >
                      <Image className="h-3 w-3 mr-2" />
                      Export to SVG
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-7 text-xs px-2 border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </>
              )}
            </Button>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-border/40 rounded-md p-0.5 bg-muted/30 backdrop-blur-sm">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('table')}
                className="h-7 text-xs px-2"
              >
                <Table2 className="h-3 w-3 mr-1" />
                Table
              </Button>
              <Button
                variant={viewMode === 'graph' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('graph')}
                className="h-7 text-xs px-2"
              >
                <Network className="h-3 w-3 mr-1" />
                Graph
              </Button>
            </div>
            {viewMode === 'table' && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs hover:bg-muted/40"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
            <Badge variant="outline" className="text-xs">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </Badge>
            {viewMode === 'graph' && (
              <Sheet open={showVisualizationSettings} onOpenChange={setShowVisualizationSettings}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                  >
                    <Palette className="h-3 w-3 mr-1" />
                    Visualization
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto p-4">
                  <SheetHeader>
                    <SheetTitle>Visualization Settings</SheetTitle>
                    <SheetDescription>
                      Customize graph layout, colors, and sizing
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Layout</Label>
                      <Select
                        value={visualizationConfig.layout || 'force'}
                        onValueChange={(value) => setVisualizationConfig({ ...visualizationConfig, layout: value as VisualizationConfig['layout'] })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="force">Force-Directed</SelectItem>
                          <SelectItem value="hierarchical">Hierarchical</SelectItem>
                          <SelectItem value="circular">Circular</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="timeline">Timeline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Node Colors by Label */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Node Colors</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from(new Set(
                          (results || []).flatMap(row => {
                            if (!row || typeof row !== 'object') return [] as string[]
                            const labels: string[] = []

                            // Helper to check if object is a node
                            const checkNode = (obj: any) => {
                              if (obj && typeof obj === 'object' && 'labels' in obj && Array.isArray(obj.labels)) {
                                labels.push(...obj.labels)
                              }
                            }

                            // Check if row itself is a node
                            checkNode(row)

                            // Check all values in the row
                            Object.values(row).forEach(val => {
                              checkNode(val)
                              // Handle array of nodes (e.g. paths or lists)
                              if (Array.isArray(val)) {
                                val.forEach(checkNode)
                              }
                            })

                            return labels
                          })
                            .filter(l => !['Thing', 'TextUnit', 'VisualUnit', 'GraphicalUnit', 'GrammaticalUnit', 'MorphologicalUnit', 'TextInformationLayer', 'PoetologicalUnit'].includes(l as string))
                        )).sort().map((label: any) => (
                          <div key={label} className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-muted/20">
                            <span className="text-xs font-medium truncate max-w-[100px]" title={label}>{label}</span>
                            <div className="flex items-center gap-2">
                              {visualizationConfig.nodeLabelColors?.[label] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-transparent"
                                  onClick={() => {
                                    const newColors = { ...visualizationConfig.nodeLabelColors }
                                    delete newColors[label]
                                    setVisualizationConfig({ ...visualizationConfig, nodeLabelColors: newColors })
                                  }}
                                  title="Reset color"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <div className="h-6 w-6 rounded-full overflow-hidden border border-border/50 relative shadow-sm">
                                <input
                                  type="color"
                                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 bg-transparent cursor-pointer"
                                  value={visualizationConfig.nodeLabelColors?.[label] || DEFAULT_NODE_COLORS[label as keyof typeof DEFAULT_NODE_COLORS] || '#6b7280'}
                                  onChange={(e) => setVisualizationConfig({
                                    ...visualizationConfig,
                                    nodeLabelColors: {
                                      ...visualizationConfig.nodeLabelColors,
                                      [label]: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relationship Colors by Type */}
                    {/* Relationship Colors by Type */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Relationship Colors</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from(new Set([
                          // 1. From live graph data
                          ...(activeGraphData?.edges || []).map(e => e.type || ''),
                          // 2. From initial results (recursive scan)
                          ...(results || []).flatMap(row => {
                            if (!row || typeof row !== 'object') return [] as string[]
                            const types: string[] = []
                            // Helper to check if object is a relationship
                            const checkRel = (obj: any) => {
                              if (obj && typeof obj === 'object' && 'type' in obj && 'start' in obj && 'end' in obj) {
                                types.push(obj.type)
                              }
                            }
                            checkRel(row)
                            Object.values(row).forEach(val => {
                              checkRel(val)
                              if (Array.isArray(val)) val.forEach(checkRel)
                            })
                            return types
                          })
                        ])).filter(Boolean).sort().map((type: any) => (
                          <div key={type} className="flex items-center justify-between p-2 rounded border border-border/40 bg-muted/20">
                            <span className="text-xs truncate max-w-[100px]" title={type}>{type}</span>
                            <div className="flex items-center gap-2">
                              {visualizationConfig.relationshipTypeColors?.[type] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    const newColors = { ...visualizationConfig.relationshipTypeColors }
                                    delete newColors[type]
                                    setVisualizationConfig({ ...visualizationConfig, relationshipTypeColors: newColors })
                                  }}
                                  title="Reset color"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <div className="h-6 w-6 rounded-full overflow-hidden border border-border/50 relative shadow-sm">
                                <input
                                  type="color"
                                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 bg-transparent cursor-pointer"
                                  value={visualizationConfig.relationshipTypeColors?.[type] || '#999999'}
                                  onChange={(e) => setVisualizationConfig({
                                    ...visualizationConfig,
                                    relationshipTypeColors: {
                                      ...visualizationConfig.relationshipTypeColors,
                                      [type]: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto flex flex-col p-4">
        {viewMode === 'table' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filters */}
            <div className="space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search all columns..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* Column Filters */}
              {allKeys.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allKeys.map(key => {
                    const label = aliasToLabel[key] || key
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <Label className="text-xs whitespace-nowrap">
                          {label}
                          {aliasToLabel[key] && (
                            <span className="text-muted-foreground font-normal ml-1">({key})</span>
                          )}:
                        </Label>
                        <Input
                          type="text"
                          placeholder={`Filter ${label}...`}
                          value={columnFilters[key] || ''}
                          onChange={(e) => handleColumnFilter(key, e.target.value)}
                          className="h-7 text-xs w-32 bg-muted/30 border-border/40 backdrop-blur-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Table */}
            <ScrollArea className="flex-1 rounded-md border border-border/20 min-h-0 gradient-table">
              <Table>
                <TableHeader className="sticky top-0 gradient-table-header z-10">
                  <TableRow>
                    {allKeys.filter(key => visibleColumns.has(key)).map(key => {
                      const label = aliasToLabel[key] || key
                      return (
                        <TableHead key={key} className="text-xs font-semibold">
                          {label}
                          {aliasToLabel[key] && (
                            <span className="text-muted-foreground font-normal ml-1">({key})</span>
                          )}
                        </TableHead>
                      )
                    })}
                    <TableHead className="text-xs font-semibold w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={allKeys.filter(key => visibleColumns.has(key)).length + 1} className="text-center py-8 text-muted-foreground text-xs">
                        No results match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedResults.map((result: unknown, idx: number) => {
                      const globalIdx = startIndex + idx
                      const resultObj = result as Record<string, unknown>
                      const isEditingThisRow = editingCell?.rowIdx === idx
                      const nodes = extractNodeIdsFromRow(resultObj)
                      const relationships = extractRelationshipIdsFromRow(resultObj)
                      const deletableEntities = [
                        ...nodes.map(n => ({ ...n, entityType: 'node' as const })),
                        ...relationships.map(r => ({ ...r, entityType: 'relationship' as const }))
                      ]

                      return (
                        <TableRow key={globalIdx} className="gradient-table-row group">
                          {allKeys.filter(key => visibleColumns.has(key)).map(key => {
                            const isEditingThisCell = isEditingThisRow && editingCell?.key === key && !editingCell?.property
                            const cellValue = resultObj[key]
                            const entityInfo = getEntityInfo(resultObj, key)

                            // If cell contains node/relationship object, render it with editable properties
                            if (isNodeObject(cellValue) || isRelationshipObject(cellValue)) {
                              return (
                                <TableCell
                                  key={key}
                                  className="text-xs p-1 relative"
                                >
                                  <div className="min-h-[20px]">
                                    {formatValue(cellValue, idx, key)}
                                  </div>
                                </TableCell>
                              )
                            }

                            return (
                              <TableCell
                                key={key}
                                className="text-xs p-1 relative"
                              >
                                {isEditingThisCell ? (
                                  <TableCellEditor
                                    value={cellValue}
                                    onSave={(newValue) => handleCellSave(idx, key, newValue)}
                                    onCancel={handleCellCancel}
                                  />
                                ) : (
                                  <div className="min-h-[20px] flex items-center justify-between group/cell">
                                    <div className="flex-1">
                                      {formatValue(cellValue, idx, key)}
                                    </div>
                                    {entityInfo.canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCellEdit(idx, key)
                                        }}
                                        className="h-6 w-6 p-0 opacity-0 group-hover/cell:opacity-100 transition-opacity ml-2 shrink-0"
                                        title="Edit"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-xs p-1">
                            {deletableEntities.length > 0 && (
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {deletableEntities.map((entity, entityIdx) => {
                                  const entityLabel = entity.entityType === 'node'
                                    ? `${entity.labels.join(', ')} (ID: ${entity.id})`
                                    : `${entity.type} relationship (ID: ${entity.id})`
                                  const columnLabel = aliasToLabel[entity.column] || entity.column
                                  const displayLabel = entity.entityType === 'node'
                                    ? columnLabel
                                    : `${columnLabel} (${entity.type})`
                                  return (
                                    <Button
                                      key={entityIdx}
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteClick(idx, entity.entityType, entity.id, entityLabel)
                                      }}
                                      className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs justify-start"
                                      title={`Delete ${columnLabel}: ${entityLabel}`}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1 shrink-0" />
                                      <span className="truncate max-w-[100px]" title={displayLabel}>{displayLabel}</span>
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2 border-t shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Results per page:</Label>
                  <Select
                    value={itemsPerPage === -1 ? 'all' : String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(value === 'all' ? -1 : parseInt(value))
                    }}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {totalPages > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-7 text-xs"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
                    </div>
                  </>
                )}
                {totalPages <= 1 && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              {totalPages > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <div ref={graphContainerRef}>
              <GraphView
                results={results || []}
                loading={loading}
                onRefresh={onRefresh}
                visualizationConfig={visualizationConfig}
                onGraphDataChange={handleGraphDataChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save your query for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={saveFormData.name}
                onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                placeholder="My Query"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={saveFormData.description}
                onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                placeholder="What does this query do?"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={saveFormData.category}
                onChange={(e) => setSaveFormData({ ...saveFormData, category: e.target.value })}
                placeholder="explore, search, analyze..."
              />
            </div>
            <div className="space-y-2">
              <Label>Query *</Label>
              <Textarea
                value={saveFormData.query}
                onChange={(e) => setSaveFormData({ ...saveFormData, query: e.target.value })}
                placeholder={CommonQueries.defaultQuery()}
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuery}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Node Dialog */}
      <CreateNodeDialog
        open={createNodeDialogOpen}
        onOpenChange={setCreateNodeDialogOpen}
        onSuccess={() => {
          setCreateNodeDialogOpen(false)
          onRefresh?.()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, rowIdx: null, type: null, id: null, label: undefined })
            setCascadeDelete(false)
            setOutgoingRelationshipsCount(null)
          }
        }}
        onConfirm={handleConfirmDelete}
        title={deleteDialog.type === 'node' ? 'Delete Node' : 'Delete Relationship'}
        description={
          deleteDialog.type === 'node' ? (
            <div className="space-y-3">
              <p>
                {outgoingRelationshipsCount !== null && outgoingRelationshipsCount > 0
                  ? `Are you sure you want to delete this node? It has ${outgoingRelationshipsCount} outgoing relationship${outgoingRelationshipsCount === 1 ? '' : 's'}.`
                  : 'Are you sure you want to delete this node?'}
              </p>
              {outgoingRelationshipsCount !== null && outgoingRelationshipsCount > 0 && (
                <div className="flex items-start space-x-2 p-3 bg-muted rounded-md">
                  <Checkbox
                    id="cascade-delete-table"
                    checked={cascadeDelete}
                    onCheckedChange={(checked) => setCascadeDelete(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor="cascade-delete-table"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Cascade delete (delete connected nodes)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      This node contains {outgoingRelationshipsCount} other node{outgoingRelationshipsCount === 1 ? '' : 's'}. If enabled, those nodes will also be deleted. Otherwise, only relationships will be removed and connected nodes will remain.
                    </p>
                  </div>
                </div>
              )}
              {outgoingRelationshipsCount !== null && outgoingRelationshipsCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  All relationships connected to this node will be removed (DETACH DELETE). This action cannot be undone.
                </p>
              )}
              {outgoingRelationshipsCount === null && (
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              )}
            </div>
          ) : (
            `Are you sure you want to delete ${deleteDialog.label || 'this relationship'}? This action cannot be undone.`
          )
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSaving}
      />
    </div>
  )
}

