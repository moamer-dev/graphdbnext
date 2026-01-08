'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database as DatabaseIcon, Loader2, RefreshCw, Upload, Network, Link2, Plus, ChevronDown, ChevronRight, Trash2, Eye, Search, LayoutGrid, List, X } from 'lucide-react'
import { useDatabase } from '../../hooks/database/useDatabase'
import { useNodeLabels } from '../../hooks/database/useNodeLabels'
import { useRelationshipTypes } from '../../hooks/database/useRelationshipTypes'
import { useNodeList, type GraphNode } from '../../hooks/database/useNodeList'
import { useSchemaExplorer } from '../../hooks/schema/useSchemaExplorer'
import { CreateNodeDialog } from './CreateNodeDialog'
import { CreateRelationshipDialog } from './CreateRelationshipDialog'
import { NodeFactSheet } from './NodeFactSheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RelationshipQueries, NodeQueries } from '@/lib/queries/cypherQueries'
import { useMutation } from '../../hooks/database/useMutation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface RelationshipListItem {
  relId: number | string
  fromId: number | string
  toId: number | string
  type: string
  properties: Record<string, unknown>
  fromLabels: string[]
  toLabels: string[]
}

type ViewMode = 'compact' | 'detailed'

export function DatabaseView () {
  const {
    loading,
    dbStatus,
    isInitializing,
    checkStatus,
    loadGraphFromFile
  } = useDatabase()
  
  const { nodeLabels, loading: loadingLabels, refresh: refreshNodeLabels } = useNodeLabels()
  const { relationshipTypes, loading: loadingRelationships, refresh: refreshRelationships } = useRelationshipTypes({})
  const { deleteNode, deleteRelationship } = useMutation()
  const { statistics: schemaStatistics, fetchSchema } = useSchemaExplorer()
  
  // Schema info cache per label
  const [labelSchemaInfo, setLabelSchemaInfo] = useState<Record<string, {
    properties: Array<{ key: string; type: string; nullable: boolean; distribution?: { unique: number } }>
    relationships: Array<{ type: string; direction: string; count: number }>
  }>>({})
  
  const [createNodeDialogOpen, setCreateNodeDialogOpen] = useState(false)
  const [createRelationshipDialogOpen, setCreateRelationshipDialogOpen] = useState(false)
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null)
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | null>(null)
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({})
  const [relationshipCounts, setRelationshipCounts] = useState<Record<string, number>>({})
  const [relationshipsByType, setRelationshipsByType] = useState<Record<string, RelationshipListItem[]>>({})
  const [loadingNodeCounts, setLoadingNodeCounts] = useState(false)
  const [loadingRelationshipCounts, setLoadingRelationshipCounts] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [nodeFactSheetOpen, setNodeFactSheetOpen] = useState(false)
  
  // Filters and search
  const [nodeSearchTerm, setNodeSearchTerm] = useState('')
  const [relationshipSearchTerm, setRelationshipSearchTerm] = useState('')
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  
  // Labels that have matching nodes when searching
  const [matchingLabels, setMatchingLabels] = useState<string[]>([])
  const [loadingMatchingLabels, setLoadingMatchingLabels] = useState(false)
  
  // Pagination
  const [nodePage, setNodePage] = useState<Record<string, number>>({})
  const [relationshipPage, setRelationshipPage] = useState<Record<string, number>>({})
  const itemsPerPage = 50
  
  // Bulk selection
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [selectedRelationships, setSelectedRelationships] = useState<Set<string>>(new Set())
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('detailed')
  
  // Delete confirm dialogs
  const [deleteNodeDialog, setDeleteNodeDialog] = useState<{ open: boolean; nodeId?: number | string; label?: string }>({ open: false })
  const [deleteRelationshipDialog, setDeleteRelationshipDialog] = useState<{ open: boolean; relId?: number | string; type?: string }>({ open: false })
  const [bulkDeleteNodesDialog, setBulkDeleteNodesDialog] = useState<{ open: boolean; label?: string }>({ open: false })
  const [bulkDeleteRelationshipsDialog, setBulkDeleteRelationshipsDialog] = useState<{ open: boolean; type?: string }>({ open: false })

  // Fetch schema statistics on mount
  useEffect(() => {
    fetchSchema().catch(() => {
      // Error already handled in hook
    })
  }, [fetchSchema])

  // Extract schema info for labels from statistics
  useEffect(() => {
    if (schemaStatistics?.nodeLabels) {
      const schemaMap: Record<string, {
        properties: Array<{ key: string; type: string; nullable: boolean; distribution?: { unique: number } }>
        relationships: Array<{ type: string; direction: string; count: number }>
      }> = {}
      
      schemaStatistics.nodeLabels.forEach(node => {
        schemaMap[node.label] = {
          properties: node.properties.map(prop => ({
            key: prop.key,
            type: prop.type,
            nullable: prop.nullable,
            distribution: prop.distribution
          })),
          relationships: node.relationships
        }
      })
      
      setLabelSchemaInfo(schemaMap)
    }
  }, [schemaStatistics])

  // Fetch node counts for each label
  useEffect(() => {
    if (nodeLabels.length === 0) return
    
    const fetchCounts = async () => {
      setLoadingNodeCounts(true)
      const counts: Record<string, number> = {}
      
      await Promise.all(
        nodeLabels.map(async (label: string) => {
          try {
            const query = NodeQueries.countNodesByLabel(label)
            const response = await fetch('/api/database/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            })
            const data = await response.json()
            if (data.success && data.results && data.results.length > 0) {
              counts[label] = data.results[0].total as number || 0
            }
          } catch (error) {
            console.error(`Error fetching count for label ${label}:`, error)
            counts[label] = 0
          }
        })
      )
      
      setNodeCounts(counts)
      setLoadingNodeCounts(false)
    }
    
    fetchCounts()
  }, [nodeLabels])

  // Fetch relationship counts for each type
  useEffect(() => {
    if (relationshipTypes.length === 0) return
    
    const fetchCounts = async () => {
      setLoadingRelationshipCounts(true)
      const counts: Record<string, number> = {}
      
      await Promise.all(
        relationshipTypes.map(async (type: string) => {
          try {
            const query = RelationshipQueries.countRelationshipsByType(type)
            const response = await fetch('/api/database/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            })
            const data = await response.json()
            if (data.success && data.results && data.results.length > 0) {
              counts[type] = data.results[0].total as number || 0
            }
          } catch (error) {
            console.error(`Error fetching count for type ${type}:`, error)
            counts[type] = 0
          }
        })
      )
      
      setRelationshipCounts(counts)
      setLoadingRelationshipCounts(false)
    }
    
    fetchCounts()
  }, [relationshipTypes])

  // Fetch nodes when a label is expanded - using server-side pagination
  const { nodes: labelNodes, totalCount: labelTotalCount, loading: loadingLabelNodes, refresh: refreshLabelNodes } = useNodeList({
    label: selectedNodeLabel || undefined,
    enabled: selectedNodeLabel !== null && expandedLabels.has(selectedNodeLabel),
    page: nodePage[selectedNodeLabel || ''] || 1,
    pageSize: itemsPerPage,
    searchTerm: nodeSearchTerm
  })

  // Fetch relationships when a type is expanded
  useEffect(() => {
    if (!selectedRelationshipType || !expandedTypes.has(selectedRelationshipType)) {
      return
    }

    const fetchRelationships = async () => {
      try {
        const page = relationshipPage[selectedRelationshipType] || 1
        const skip = (page - 1) * itemsPerPage
        const query = RelationshipQueries.getRelationshipsByType(selectedRelationshipType, skip, itemsPerPage)
        const response = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })
        const data = await response.json()
        if (data.success && data.results) {
          const relationships = data.results.map((r: {
            relId: number | string
            fromId: number | string
            toId: number | string
            type: string
            properties: Record<string, unknown>
            fromLabels: string[]
            toLabels: string[]
          }) => ({
            relId: r.relId,
            fromId: r.fromId,
            toId: r.toId,
            type: r.type,
            properties: r.properties || {},
            fromLabels: r.fromLabels || [],
            toLabels: r.toLabels || []
          }))
          setRelationshipsByType(prev => ({ ...prev, [selectedRelationshipType]: relationships }))
        }
      } catch (error) {
        console.error(`Error fetching relationships for type ${selectedRelationshipType}:`, error)
        toast.error('Failed to fetch relationships')
      }
    }

    fetchRelationships()
  }, [selectedRelationshipType, expandedTypes, relationshipPage])

  // Fetch matching labels when searching
  useEffect(() => {
    if (!nodeSearchTerm.trim()) {
      setMatchingLabels([])
      // When clearing search, reset expanded labels but keep current state
      return
    }

    const fetchMatchingLabels = async () => {
      setLoadingMatchingLabels(true)
      try {
        const query = NodeQueries.getLabelsWithMatchingNodes(nodeSearchTerm.trim())
        const response = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })
        const data = await response.json()
        if (data.success && data.results) {
          const labels = data.results.map((result: { label: string }) => result.label)
          setMatchingLabels(labels)
          
          // Auto-expand and select first matching label only (to avoid multiple fetches)
          if (labels.length > 0) {
            const firstLabel = labels[0]
            setExpandedLabels(new Set([firstLabel]))
            setSelectedNodeLabel(firstLabel)
            // Reset page to 1 for the selected label
            setNodePage(prev => ({ ...prev, [firstLabel]: 1 }))
          } else {
            // No matching labels, clear all expanded labels
            setExpandedLabels(new Set())
            setSelectedNodeLabel(null)
          }
        } else {
          setMatchingLabels([])
          setExpandedLabels(new Set())
          setSelectedNodeLabel(null)
        }
      } catch (error) {
        console.error('Error fetching matching labels:', error)
        setMatchingLabels([])
        setExpandedLabels(new Set())
        setSelectedNodeLabel(null)
      } finally {
        setLoadingMatchingLabels(false)
      }
    }

    fetchMatchingLabels()
  }, [nodeSearchTerm])

  // Filter nodes and relationships
  const filteredNodeLabels = useMemo(() => {
    let labels = nodeLabels
    
    // If searching, ONLY show labels that have matching nodes (no exceptions)
    if (nodeSearchTerm.trim()) {
      if (matchingLabels.length > 0) {
        labels = matchingLabels
      } else {
        // No matching labels found, return empty array
        labels = []
      }
    }
    
    // Apply label filter
    if (selectedLabelFilter !== 'all') {
      labels = labels.filter(label => label === selectedLabelFilter)
    }
    
    return labels
  }, [nodeLabels, selectedLabelFilter, nodeSearchTerm, matchingLabels])

  const filteredRelationshipTypes = useMemo(() => {
    if (selectedTypeFilter === 'all') return relationshipTypes
    return relationshipTypes.filter(type => type === selectedTypeFilter)
  }, [relationshipTypes, selectedTypeFilter])

  // Get nodes for a label - use server-side paginated data for selected label, empty for others
  const getNodesForLabel = (label: string): GraphNode[] => {
    if (label === selectedNodeLabel && expandedLabels.has(label)) {
      return labelNodes
    }
    return []
  }

  const getFilteredRelationships = (type: string): RelationshipListItem[] => {
    const relationships = relationshipsByType[type] || []
    if (!relationshipSearchTerm.trim()) return relationships
    const searchLower = relationshipSearchTerm.toLowerCase()
    return relationships.filter(rel => {
      const fromMatch = String(rel.fromId).includes(searchLower)
      const toMatch = String(rel.toId).includes(searchLower)
      if (fromMatch || toMatch) return true
      return Object.entries(rel.properties).some(([key, value]) => 
        key.toLowerCase().includes(searchLower) || 
        String(value).toLowerCase().includes(searchLower)
      )
    })
  }

  const toggleLabelExpansion = (label: string) => {
    setSelectedNodeLabel(label)
    setExpandedLabels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
        setNodePage(prev => ({ ...prev, [label]: 1 }))
        setSelectedNodes(new Set())
      }
      return newSet
    })
  }

  const toggleTypeExpansion = (type: string) => {
    setSelectedRelationshipType(type)
    setExpandedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
        setRelationshipPage(prev => ({ ...prev, [type]: 1 }))
        setSelectedRelationships(new Set())
      }
      return newSet
    })
  }

  const handleNodeCreated = () => {
    refreshNodeLabels()
    checkStatus(false)
    setCreateNodeDialogOpen(false)
  }

  const handleRelationshipCreated = () => {
    refreshRelationships()
    checkStatus(false)
    setCreateRelationshipDialogOpen(false)
  }

  const handleDeleteNode = async (nodeId: number | string, label: string) => {
    const success = await deleteNode(nodeId, false, false)
    if (success) {
      refreshNodeLabels()
      checkStatus(false)
      if (label === selectedNodeLabel) {
        refreshLabelNodes()
      }
      toast.success('Node deleted successfully')
    }
  }

  const handleDeleteRelationship = async (relId: number | string, type: string) => {
    const success = await deleteRelationship(relId)
    if (success) {
      refreshRelationships()
      checkStatus(false)
      setRelationshipsByType(prev => {
        const updated = { ...prev }
        if (updated[type]) {
          updated[type] = updated[type].filter(r => r.relId !== relId)
        }
        return updated
      })
      toast.success('Relationship deleted successfully')
    }
  }

  const handleBulkDeleteNodes = async (label: string) => {
    const nodeIds = Array.from(selectedNodes)
    let successCount = 0
    let failCount = 0

    for (const nodeIdStr of nodeIds) {
      const nodeId = isNaN(Number(nodeIdStr)) ? nodeIdStr : Number(nodeIdStr)
      const success = await deleteNode(nodeId, false, false)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (successCount > 0) {
      refreshNodeLabels()
      checkStatus(false)
      if (label === selectedNodeLabel) {
        refreshLabelNodes()
      }
      setSelectedNodes(new Set())
      toast.success(`Deleted ${successCount} node${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`)
    }
  }

  const handleBulkDeleteRelationships = async (type: string) => {
    const relIds = Array.from(selectedRelationships)
    let successCount = 0
    let failCount = 0

    for (const relIdStr of relIds) {
      const relId = isNaN(Number(relIdStr)) ? relIdStr : Number(relIdStr)
      const success = await deleteRelationship(relId)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (successCount > 0) {
      refreshRelationships()
      checkStatus(false)
      setRelationshipsByType(prev => {
        const updated = { ...prev }
        if (updated[type]) {
          updated[type] = updated[type].filter(r => !selectedRelationships.has(String(r.relId)))
        }
        return updated
      })
      setSelectedRelationships(new Set())
      toast.success(`Deleted ${successCount} relationship${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`)
    }
  }

  const handleViewNode = (node: GraphNode) => {
    setSelectedNode(node)
    setNodeFactSheetOpen(true)
  }

  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const toggleRelationshipSelection = (relId: string) => {
    setSelectedRelationships(prev => {
      const newSet = new Set(prev)
      if (newSet.has(relId)) {
        newSet.delete(relId)
      } else {
        newSet.add(relId)
      }
      return newSet
    })
  }

  const toggleSelectAllNodes = (label: string, checked: boolean) => {
    const nodes = getNodesForLabel(label)
    if (checked) {
      const allIds = new Set(nodes.map((n: GraphNode) => String(n.id || n.nodeId)))
      setSelectedNodes(allIds)
    } else {
      setSelectedNodes(new Set())
    }
  }

  const toggleSelectAllRelationships = (type: string, checked: boolean) => {
    const relationships = getFilteredRelationships(type)
    if (checked) {
      const allIds = new Set(relationships.map((r: RelationshipListItem) => String(r.relId)))
      setSelectedRelationships(allIds)
    } else {
      setSelectedRelationships(new Set())
    }
  }

  const isConnected = dbStatus?.connected ?? false
  const nodeCount = dbStatus?.stats?.nodeCount ?? 0
  const relationshipCount = dbStatus?.stats?.relationshipCount ?? 0
  const nodeLabelsCount = nodeLabels.length
  const showLoading = isInitializing || (loading && !dbStatus)

  return (
    <div className="space-y-4 mt-4">
      {/* Database Status */}
      <div className="gradient-header-minimal pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            <span className="relative">
              Database Management
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h1>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Manage nodes, relationships, and database operations
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Status Section */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Connection Status</div>
                {showLoading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Checking...</span>
                  </div>
                ) : (
                  <Badge 
                    variant={isConnected ? 'outline' : 'destructive'} 
                    className={`text-xs ${isConnected ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : ''}`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                )}
              </div>
              <Separator orientation="vertical" className="h-6 opacity-30" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Nodes</div>
                <div className="flex items-center gap-1.5">
                  <Network className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm font-semibold">{nodeCount.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Relationships</div>
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm font-semibold">{relationshipCount.toLocaleString()}</div>
                </div>
              </div>
              <Separator orientation="vertical" className="h-6 opacity-30" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Node Labels</div>
                <div className="flex items-center gap-1.5">
                  <Network className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm font-semibold">{nodeLabelsCount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => checkStatus(false)}
              disabled={loading}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Refresh
                </>
              )}
            </Button>
          </div>

        {/* Nodes and Relationships Management */}
        <Tabs defaultValue="nodes" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  className="h-6 w-6 p-0"
                  onClick={() => setViewMode('compact')}
                  title="Compact view"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  className="h-6 w-6 p-0"
                  onClick={() => setViewMode('detailed')}
                  title="Detailed view"
                >
                  <LayoutGrid className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="nodes" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search nodes..."
                    value={nodeSearchTerm}
                    onChange={(e) => setNodeSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                  {nodeSearchTerm && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                      onClick={() => setNodeSearchTerm('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select value={selectedLabelFilter} onValueChange={setSelectedLabelFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Filter by label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    {nodeLabels.map(label => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setCreateNodeDialogOpen(true)}
                size="sm"
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Create Node
              </Button>
            </div>

            {loadingLabels || loadingMatchingLabels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNodeLabels.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {nodeSearchTerm.trim() 
                  ? 'No node labels found matching your search' 
                  : selectedLabelFilter !== 'all' 
                    ? 'No nodes found for selected filter' 
                    : 'No node labels found'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNodeLabels.map((label: string) => {
                  const count = nodeCounts[label] ?? 0
                  const isExpanded = expandedLabels.has(label)
                  const isSelectedLabel = label === selectedNodeLabel
                  const nodes = getNodesForLabel(label)
                  const page = nodePage[label] || 1
                  const totalCount = isSelectedLabel ? labelTotalCount : 0
                  const totalPages = totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 0
                  const labelSelectedNodes = nodes.filter((n: GraphNode) => selectedNodes.has(String(n.id || n.nodeId)))
                  const allSelected = nodes.length > 0 && labelSelectedNodes.length === nodes.length
                  
                  return (
                    <Collapsible
                      key={label}
                      open={isExpanded}
                      onOpenChange={() => toggleLabelExpansion(label)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/20 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Network className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {loadingNodeCounts ? '...' : count.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-muted/10 rounded-md border border-border/20 space-y-3">
                          {/* Schema Information */}
                          {isExpanded && labelSchemaInfo[label] && (
                            <div className="mb-4 space-y-3 pb-4 border-b">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Schema Information</div>
                              
                              {/* Properties */}
                              {labelSchemaInfo[label].properties.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium mb-2">Properties ({labelSchemaInfo[label].properties.length})</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {labelSchemaInfo[label].properties.map((prop) => (
                                      <div key={prop.key} className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                                        <span className="font-mono font-medium">{prop.key}</span>
                                        <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                                        {prop.nullable ? (
                                          <Badge variant="outline" className="text-xs text-orange-600">Nullable</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs text-green-600">Required</Badge>
                                        )}
                                        {prop.distribution && (
                                          <span className="text-muted-foreground ml-auto">
                                            {prop.distribution.unique} unique
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Relationships */}
                              {labelSchemaInfo[label].relationships.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium mb-2">Relationships ({labelSchemaInfo[label].relationships.length})</div>
                                  <div className="flex flex-wrap gap-2">
                                    {labelSchemaInfo[label].relationships.map((rel, index) => (
                                      <div key={`${rel.type}-${rel.direction}-${index}`} className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                                        <Link2 className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">{rel.type}</span>
                                        <Badge variant="outline" className="text-xs">{rel.direction}</Badge>
                                        <Badge variant="secondary" className="text-xs">{rel.count.toLocaleString()}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bulk Actions */}
                          {isExpanded && nodes.length > 0 && (
                            <div className="flex items-center justify-between pb-2 border-b">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) => toggleSelectAllNodes(label, checked === true)}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {labelSelectedNodes.length > 0 ? `${labelSelectedNodes.length} selected` : 'Select all'}
                                </span>
                              </div>
                              {labelSelectedNodes.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 text-xs"
                                  onClick={() => setBulkDeleteNodesDialog({ open: true, label })}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete Selected ({labelSelectedNodes.length})
                                </Button>
                              )}
                            </div>
                          )}

                          {!isSelectedLabel ? null : loadingLabelNodes ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : nodes.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              {nodeSearchTerm.trim() ? 'No nodes match your search' : 'No nodes found'}
                            </div>
                          ) : (
                            <>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="h-8 w-12">
                                        {viewMode === 'detailed' && <Checkbox disabled />}
                                      </TableHead>
                                      <TableHead className="h-8">ID</TableHead>
                                      {viewMode === 'detailed' && (
                                        <TableHead className="h-8">Properties</TableHead>
                                      )}
                                      <TableHead className="h-8 w-24">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {nodes.map((node: GraphNode) => {
                                      const nodeId = String(node.id || node.nodeId)
                                      const isSelected = selectedNodes.has(nodeId)
                                      
                                      return (
                                        <TableRow key={node.id || node.nodeId} className={isSelected ? 'bg-muted/50' : ''}>
                                          {viewMode === 'detailed' && (
                                            <TableCell className="py-2">
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleNodeSelection(nodeId)}
                                              />
                                            </TableCell>
                                          )}
                                          <TableCell className="py-2 text-xs font-mono">
                                            {nodeId}
                                          </TableCell>
                                          {viewMode === 'detailed' && (
                                            <TableCell className="py-2 text-xs">
                                              {Object.keys(node.properties).length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                  {Object.entries(node.properties).slice(0, 3).map(([key, value]) => (
                                                    <Badge key={key} variant="outline" className="text-xs">
                                                      {key}: {String(value).slice(0, 20)}
                                                    </Badge>
                                                  ))}
                                                  {Object.keys(node.properties).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                      +{Object.keys(node.properties).length - 3} more
                                                    </Badge>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground">No properties</span>
                                              )}
                                            </TableCell>
                                          )}
                                          <TableCell className="py-2">
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleViewNode(node)}
                                                title="View node details"
                                              >
                                                <Eye className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteNodeDialog({ open: true, nodeId: node.id || node.nodeId, label })}
                                                title="Delete node"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="text-xs text-muted-foreground">
                                    Page {page} of {totalPages} ({totalCount.toLocaleString()} total)
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      disabled={page === 1}
                                      onClick={() => setNodePage(prev => ({ ...prev, [label]: page - 1 }))}
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      disabled={page === totalPages}
                                      onClick={() => setNodePage(prev => ({ ...prev, [label]: page + 1 }))}
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search relationships..."
                    value={relationshipSearchTerm}
                    onChange={(e) => setRelationshipSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                  {relationshipSearchTerm && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                      onClick={() => setRelationshipSearchTerm('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {relationshipTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setCreateRelationshipDialogOpen(true)}
                size="sm"
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Create Relationship
              </Button>
            </div>

            {loadingRelationships ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRelationshipTypes.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {selectedTypeFilter !== 'all' ? 'No relationships found for selected filter' : 'No relationship types found'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRelationshipTypes.map((type: string) => {
                  const count = relationshipCounts[type] ?? 0
                  const isExpanded = expandedTypes.has(type)
                  const relationships = getFilteredRelationships(type)
                  const page = relationshipPage[type] || 1
                  const totalPages = Math.ceil(relationships.length / itemsPerPage)
                  const paginatedRelationships = relationships.slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  const typeSelectedRelationships = paginatedRelationships.filter((r: RelationshipListItem) => selectedRelationships.has(String(r.relId)))
                  const allSelected = paginatedRelationships.length > 0 && typeSelectedRelationships.length === paginatedRelationships.length
                  
                  return (
                    <Collapsible
                      key={type}
                      open={isExpanded}
                      onOpenChange={() => toggleTypeExpansion(type)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/20 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{type}</span>
                            <Badge variant="secondary" className="text-xs">
                              {loadingRelationshipCounts ? '...' : count.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-muted/10 rounded-md border border-border/20 space-y-3">
                          {/* Bulk Actions */}
                          {isExpanded && paginatedRelationships.length > 0 && (
                            <div className="flex items-center justify-between pb-2 border-b">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) => toggleSelectAllRelationships(type, checked === true)}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {typeSelectedRelationships.length > 0 ? `${typeSelectedRelationships.length} selected` : 'Select all'}
                                </span>
                              </div>
                              {typeSelectedRelationships.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 text-xs"
                                  onClick={() => setBulkDeleteRelationshipsDialog({ open: true, type })}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete Selected ({typeSelectedRelationships.length})
                                </Button>
                              )}
                            </div>
                          )}

                          {paginatedRelationships.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              {relationshipSearchTerm ? 'No relationships match your search' : 'Loading...'}
                            </div>
                          ) : (
                            <>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="h-8 w-12">
                                        {viewMode === 'detailed' && <Checkbox disabled />}
                                      </TableHead>
                                      <TableHead className="h-8">From</TableHead>
                                      <TableHead className="h-8">To</TableHead>
                                      {viewMode === 'detailed' && (
                                        <TableHead className="h-8">Properties</TableHead>
                                      )}
                                      <TableHead className="h-8 w-24">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedRelationships.map((rel: RelationshipListItem) => {
                                      const relId = String(rel.relId)
                                      const isSelected = selectedRelationships.has(relId)
                                      
                                      return (
                                        <TableRow key={rel.relId} className={isSelected ? 'bg-muted/50' : ''}>
                                          {viewMode === 'detailed' && (
                                            <TableCell className="py-2">
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleRelationshipSelection(relId)}
                                              />
                                            </TableCell>
                                          )}
                                          <TableCell className="py-2 text-xs font-mono">
                                            {rel.fromLabels.join(', ')} ({String(rel.fromId)})
                                          </TableCell>
                                          <TableCell className="py-2 text-xs font-mono">
                                            {rel.toLabels.join(', ')} ({String(rel.toId)})
                                          </TableCell>
                                          {viewMode === 'detailed' && (
                                            <TableCell className="py-2 text-xs">
                                              {Object.keys(rel.properties).length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                  {Object.entries(rel.properties).slice(0, 3).map(([key, value]) => (
                                                    <Badge key={key} variant="outline" className="text-xs">
                                                      {key}: {String(value).slice(0, 20)}
                                                    </Badge>
                                                  ))}
                                                  {Object.keys(rel.properties).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                      +{Object.keys(rel.properties).length - 3} more
                                                    </Badge>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground">No properties</span>
                                              )}
                                            </TableCell>
                                          )}
                                          <TableCell className="py-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                              onClick={() => setDeleteRelationshipDialog({ open: true, relId: rel.relId, type })}
                                              title="Delete relationship"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="text-xs text-muted-foreground">
                                    Page {page} of {totalPages} ({relationships.length} total)
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      disabled={page === 1}
                                      onClick={() => setRelationshipPage(prev => ({ ...prev, [type]: page - 1 }))}
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      disabled={page === totalPages}
                                      onClick={() => setRelationshipPage(prev => ({ ...prev, [type]: page + 1 }))}
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Load Graph Data */}
      <div className="gradient-header-minimal pb-3 mt-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            <span className="relative">
              Data Import
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h2>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Load graph data from JSON file
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Load Graph Data</h3>
          </div>
          <input
            type="file"
            accept=".json"
            onChange={loadGraphFromFile}
            disabled={loading}
            className="hidden"
            id="json-upload"
          />
          <label
            htmlFor="json-upload"
            className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              loading
                ? 'bg-muted cursor-not-allowed opacity-50'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <Upload className="h-3 w-3" />
            {loading ? 'Loading...' : 'Upload JSON'}
          </label>
        </div>
      </div>

      {/* Dialogs */}
      <CreateNodeDialog
        open={createNodeDialogOpen}
        onOpenChange={setCreateNodeDialogOpen}
        onSuccess={handleNodeCreated}
      />
      
      <CreateRelationshipDialog
        open={createRelationshipDialogOpen}
        onOpenChange={setCreateRelationshipDialogOpen}
        onSuccess={handleRelationshipCreated}
      />

      {/* Delete Confirm Dialogs */}
      <ConfirmDialog
        open={deleteNodeDialog.open}
        onOpenChange={(open) => setDeleteNodeDialog({ open, nodeId: deleteNodeDialog.nodeId, label: deleteNodeDialog.label })}
        title="Delete Node"
        description={`Are you sure you want to delete this node? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteNodeDialog.nodeId && deleteNodeDialog.label) {
            await handleDeleteNode(deleteNodeDialog.nodeId, deleteNodeDialog.label)
            setDeleteNodeDialog({ open: false })
          }
        }}
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteRelationshipDialog.open}
        onOpenChange={(open) => setDeleteRelationshipDialog({ open, relId: deleteRelationshipDialog.relId, type: deleteRelationshipDialog.type })}
        title="Delete Relationship"
        description="Are you sure you want to delete this relationship? This action cannot be undone."
        onConfirm={async () => {
          if (deleteRelationshipDialog.relId && deleteRelationshipDialog.type) {
            await handleDeleteRelationship(deleteRelationshipDialog.relId, deleteRelationshipDialog.type)
            setDeleteRelationshipDialog({ open: false })
          }
        }}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkDeleteNodesDialog.open}
        onOpenChange={(open) => setBulkDeleteNodesDialog({ open, label: bulkDeleteNodesDialog.label })}
        title="Delete Selected Nodes"
        description={`Are you sure you want to delete ${selectedNodes.size} selected node${selectedNodes.size > 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={async () => {
          if (bulkDeleteNodesDialog.label) {
            await handleBulkDeleteNodes(bulkDeleteNodesDialog.label)
            setBulkDeleteNodesDialog({ open: false })
          }
        }}
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkDeleteRelationshipsDialog.open}
        onOpenChange={(open) => setBulkDeleteRelationshipsDialog({ open, type: bulkDeleteRelationshipsDialog.type })}
        title="Delete Selected Relationships"
        description={`Are you sure you want to delete ${selectedRelationships.size} selected relationship${selectedRelationships.size > 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={async () => {
          if (bulkDeleteRelationshipsDialog.type) {
            await handleBulkDeleteRelationships(bulkDeleteRelationshipsDialog.type)
            setBulkDeleteRelationshipsDialog({ open: false })
          }
        }}
        variant="destructive"
      />

      <Sheet open={nodeFactSheetOpen && selectedNode !== null} onOpenChange={(open) => {
        if (!open) {
          setNodeFactSheetOpen(false)
          setSelectedNode(null)
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
          <SheetHeader className="sr-only p-0">
            <SheetTitle>
              {selectedNode ? `${selectedNode.labels.join('::')} - Node Details` : 'Node Details'}
            </SheetTitle>
          </SheetHeader>
          {selectedNode && (
            <NodeFactSheet
              node={{
                id: String(selectedNode.id || selectedNode.nodeId || ''),
                labels: selectedNode.labels,
                properties: selectedNode.properties,
                nodeId: typeof selectedNode.nodeId === 'number' ? selectedNode.nodeId : (typeof selectedNode.id === 'number' ? selectedNode.id : parseInt(String(selectedNode.nodeId || selectedNode.id || '0'), 10))
              }}
              edges={[]}
              allNodes={[]}
              onClose={() => {
                setNodeFactSheetOpen(false)
                setSelectedNode(null)
              }}
              isExpanded={nodeFactSheetOpen}
              onNodeUpdate={() => {
                refreshNodeLabels()
                checkStatus(false)
                if (selectedNodeLabel) {
                  refreshLabelNodes()
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
