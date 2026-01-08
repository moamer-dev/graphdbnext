'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Plus, X, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn, getNodeLabel } from '@/lib/utils'
import { useNodeLabels, useRelationshipTypes, useNodeList, useRelationshipMaxPos, useNodeById, useRelationshipForm, useNodeFiltering, type GraphNode as GraphNodeType } from '../../hooks'
import { CreateNodeDialog } from './CreateNodeDialog'


interface CreateRelationshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  sourceNodeId?: number | string
  availableNodes?: GraphNodeType[]
  availableRelationshipTypes?: string[]
}

export function CreateRelationshipDialog ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  sourceNodeId,
  availableNodes = [],
  availableRelationshipTypes = []
}: CreateRelationshipDialogProps) {
  const [fromNodeId, setFromNodeId] = useState<number | string | undefined>(sourceNodeId)
  const [toNodeId, setToNodeId] = useState<number | string | undefined>(undefined)
  const [relationshipType, setRelationshipType] = useState<string>('')
  const [createNodeDialogOpen, setCreateNodeDialogOpen] = useState(false)
  const [createdNodes, setCreatedNodes] = useState<GraphNodeType[]>([])
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string>('')
  const [toNodePopoverOpen, setToNodePopoverOpen] = useState(false)
  const [toNodeSearch, setToNodeSearch] = useState('')
  const [relationshipTypePopoverOpen, setRelationshipTypePopoverOpen] = useState(false)
  const [relationshipTypeSearch, setRelationshipTypeSearch] = useState('')
  const [newRelationshipTypeDialogOpen, setNewRelationshipTypeDialogOpen] = useState(false)
  const [newRelationshipTypeInput, setNewRelationshipTypeInput] = useState('')
  const [nodeLabelPopoverOpen, setNodeLabelPopoverOpen] = useState(false)
  const [nodeLabelSearch, setNodeLabelSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const nodesPerPage = 50
  
  const { nodeLabels: allNodeLabels, loading: loadingLabels, refresh: refreshNodeLabels } = useNodeLabels(open)
  const { relationshipTypes: allRelationshipTypes, loading: loadingRelationshipTypes, refresh: refreshRelationshipTypes } = useRelationshipTypes({ enabled: open })
  const { nodes: nodesForLabel, totalCount: totalNodesForLabel, loading: loadingNodes } = useNodeList({
    label: selectedNodeLabel,
    enabled: open && !!selectedNodeLabel,
    page: currentPage,
    pageSize: nodesPerPage
  })
  const { maxPos } = useRelationshipMaxPos(relationshipType, open && !!relationshipType)
  const { fetchNodeById } = useNodeById()
  
  const relationshipForm = useRelationshipForm({
    fromNodeId,
    toNodeId,
    relationshipType,
    onSuccess,
    onOpenChange
  })
  
  const nodeFiltering = useNodeFiltering({
    nodesForLabel,
    availableNodes,
    createdNodes,
    selectedNodeLabel,
    toNodeId,
    fromNodeId,
    searchTerm: toNodeSearch
  })
  
  const { filteredNodes, allNodesForFromNode, selectedFromNode, selectedToNode } = nodeFiltering
  
  // Track previous open state to detect when dialog closes
  const prevOpenRef = useRef(open)

  // Use provided relationship types if available, otherwise use fetched ones
  const relationshipTypes = availableRelationshipTypes.length > 0
    ? availableRelationshipTypes
    : allRelationshipTypes

  // Filter relationship types based on search
  const filteredRelationshipTypes = useMemo(() => {
    if (!relationshipTypeSearch.trim()) {
      return relationshipTypes
    }
    const searchLower = relationshipTypeSearch.toLowerCase()
    return relationshipTypes.filter(type => type.toLowerCase().includes(searchLower))
  }, [relationshipTypes, relationshipTypeSearch])

  // Check if search term doesn't match any existing relationship type (for "Create new" option)
  const canCreateNewRelationshipType = useMemo(() => {
    if (!relationshipTypeSearch.trim()) return false
    const searchLower = relationshipTypeSearch.toLowerCase().trim()
    return !relationshipTypes.some(type => type.toLowerCase() === searchLower)
  }, [relationshipTypes, relationshipTypeSearch])

  // Helper function to set node label and reset pagination/search
  const handleSetSelectedNodeLabel = useCallback((label: string) => {
    setSelectedNodeLabel(label)
    setCurrentPage(1)
    setToNodeSearch('')
  }, [])

  // Track if we've added pos property for the current relationship type
  const posPropertyAddedRef = useRef<string>('')

  // Add pos property when maxPos becomes available
  useEffect(() => {
    if (!open || !relationshipType || maxPos === undefined) {
      return
    }

    // Only add pos if we haven't already added it for this relationship type
    if (posPropertyAddedRef.current === relationshipType) {
      return
    }

    // Use setTimeout to defer state update and avoid synchronous setState warning
    const timeoutId = setTimeout(() => {
      relationshipForm.setProperties(prev => {
        if (prev.some(p => p.key === 'pos')) {
          posPropertyAddedRef.current = relationshipType
          return prev
        }
        const newProperties = maxPos !== null
          ? [{ key: 'pos', value: String(maxPos + 1), type: 'number' as const }, ...prev]
          : [{ key: 'pos', value: '0', type: 'number' as const }, ...prev]
        posPropertyAddedRef.current = relationshipType
        return newProperties
      })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [open, relationshipType, maxPos, relationshipForm])

  // Sync fromNodeId when dialog opens or sourceNodeId changes
  // Reset form when dialog closes
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open
    
    if (open && sourceNodeId !== undefined && fromNodeId !== sourceNodeId) {
      // Use setTimeout to defer state update
      const timeoutId = setTimeout(() => {
        setFromNodeId(sourceNodeId)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    
    if (wasOpen && !open) {
      // Dialog just closed, reset form
      const timeoutId = setTimeout(() => {
        setToNodeId(undefined)
        setRelationshipType('')
        posPropertyAddedRef.current = ''
        relationshipForm.setProperties(prev => prev.filter(p => p.key !== 'pos'))
        relationshipForm.setNewPropertyKey('')
        relationshipForm.setNewPropertyValue('')
        relationshipForm.setNewPropertyType('string')
        setCreateNodeDialogOpen(false)
        setFromNodeId(sourceNodeId)
        setToNodePopoverOpen(false)
        handleSetSelectedNodeLabel('')
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [open, sourceNodeId, fromNodeId, handleSetSelectedNodeLabel, relationshipForm])

  const totalPages = Math.ceil(totalNodesForLabel / nodesPerPage)

  // Filter node labels based on search
  const filteredNodeLabels = useMemo(() => {
    if (!nodeLabelSearch.trim()) {
      return allNodeLabels
    }
    const searchLower = nodeLabelSearch.toLowerCase()
    return allNodeLabels.filter(label => label.toLowerCase().includes(searchLower))
  }, [allNodeLabels, nodeLabelSearch])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Relationship</DialogTitle>
          <DialogDescription>
            Create a relationship between two nodes
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Source Node */}
          <div className="space-y-2">
            <Label>From Node *</Label>
            <Select 
              value={fromNodeId ? String(fromNodeId) : ''} 
              onValueChange={(value) => setFromNodeId(value)}
              disabled={!!sourceNodeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source node" />
              </SelectTrigger>
              <SelectContent>
                {allNodesForFromNode.map(node => {
                  const nodeId = node.nodeId || node.id
                  return (
                    <SelectItem key={String(nodeId)} value={String(nodeId)}>
                      {getNodeLabel(node)} (ID: {nodeId})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedFromNode && (
              <p className="text-xs text-muted-foreground">
                {getNodeLabel(selectedFromNode)}
              </p>
            )}
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Relationship Type *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewRelationshipTypeDialogOpen(true)}
                className="h-6 text-xs px-2"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Type
              </Button>
            </div>
            <Popover open={relationshipTypePopoverOpen} onOpenChange={setRelationshipTypePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={relationshipTypePopoverOpen}
                  className="w-full justify-between text-left font-normal"
                  disabled={loadingRelationshipTypes}
                >
                  {relationshipType 
                    ? relationshipType
                    : loadingRelationshipTypes 
                    ? 'Loading relationship types...'
                    : 'Select relationship type...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search relationship types..." 
                    value={relationshipTypeSearch}
                    onValueChange={setRelationshipTypeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingRelationshipTypes ? 'Loading...' : 'No relationship types found.'}
                    </CommandEmpty>
                    {filteredRelationshipTypes.length > 0 && (
                      <CommandGroup>
                        {filteredRelationshipTypes.map(type => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() => {
                              setRelationshipType(type)
                              setRelationshipTypePopoverOpen(false)
                              setRelationshipTypeSearch('')
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                relationshipType === type ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {canCreateNewRelationshipType && (
                      <CommandGroup>
                        <CommandItem
                          value={relationshipTypeSearch.trim()}
                          onSelect={() => {
                            const newType = relationshipTypeSearch.trim()
                            setRelationshipType(newType)
                            setRelationshipTypePopoverOpen(false)
                            setRelationshipTypeSearch('')
                          }}
                          className="text-primary font-medium"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create new: &ldquo;{relationshipTypeSearch.trim()}&rdquo;
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Target Node */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>To Node *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateNodeDialogOpen(true)}
                className="h-6 text-xs px-2"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create New Node
              </Button>
            </div>
            {/* Node Type Selector */}
            <div className="space-y-2">
              <Label>Node Type</Label>
              <Popover open={nodeLabelPopoverOpen} onOpenChange={setNodeLabelPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={nodeLabelPopoverOpen}
                    className="w-full justify-between text-left font-normal"
                    disabled={loadingLabels}
                  >
                    {selectedNodeLabel 
                      ? selectedNodeLabel
                      : loadingLabels 
                      ? 'Loading node types...'
                      : 'Select node type first...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search node types..." 
                      value={nodeLabelSearch}
                      onValueChange={setNodeLabelSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingLabels ? 'Loading...' : 'No node types found.'}
                      </CommandEmpty>
                      {filteredNodeLabels.length > 0 && (
                        <CommandGroup>
                          {filteredNodeLabels.map(label => (
                            <CommandItem
                              key={label}
                              value={label}
                              onSelect={() => {
                                handleSetSelectedNodeLabel(label)
                                setToNodeId(undefined)
                                setNodeLabelPopoverOpen(false)
                                setNodeLabelSearch('')
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedNodeLabel === label ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Node Selector */}
            <Popover open={toNodePopoverOpen} onOpenChange={setToNodePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={toNodePopoverOpen}
                  className="w-full justify-between text-left font-normal"
                  disabled={loadingNodes || !selectedNodeLabel}
                >
                  {selectedToNode 
                    ? `${getNodeLabel(selectedToNode)} (ID: ${selectedToNode.nodeId || selectedToNode.id})`
                    : loadingNodes 
                    ? 'Loading nodes...'
                    : !selectedNodeLabel
                    ? 'Select node type first'
                    : 'Select target node...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex flex-col">
                  <div className="flex h-9 items-center gap-2 border-b px-3">
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                    <input
                      placeholder="Search by ID or text..."
                      value={toNodeSearch}
                      onChange={(e) => setToNodeSearch(e.target.value)}
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div 
                    className="max-h-[300px] overflow-y-auto overscroll-contain"
                    onWheelCapture={(e) => {
                      const el = e.currentTarget
                      const { scrollTop, scrollHeight, clientHeight } = el
                      const isAtTop = scrollTop === 0
                      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                      
                      // Stop propagation if we can scroll in this direction
                      if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
                        e.stopPropagation()
                      }
                    }}
                  >
                    {loadingNodes ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : !selectedNodeLabel ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Select a node type first.</div>
                    ) : filteredNodes.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No nodes found.</div>
                    ) : (
                      <div className="p-1">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          {selectedNodeLabel} ({totalNodesForLabel} total, showing page {currentPage} of {totalPages})
                        </div>
                        <div className="space-y-1">
                          {filteredNodes
                            .filter(node => {
                              const nodeId = node.nodeId || node.id
                              return String(nodeId) !== String(fromNodeId)
                            })
                            .map(node => {
                              const nodeId = node.nodeId || node.id
                              const isSelected = String(toNodeId) === String(nodeId)
                              return (
                                <div
                                  key={String(nodeId)}
                                  onClick={() => {
                                    setToNodeId(nodeId)
                                    setToNodePopoverOpen(false)
                                    setToNodeSearch('')
                                  }}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    isSelected && "bg-accent text-accent-foreground"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{getNodeLabel(node)}</span>
                                    <span className="text-xs text-muted-foreground">ID: {nodeId}</span>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedNodeLabel && totalPages > 1 && (
                    <div className="flex items-center justify-between border-t p-2">
                      <div className="text-xs text-muted-foreground">
                        Showing {filteredNodes.length} of {totalNodesForLabel} nodes
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setCurrentPage(prev => Math.max(1, prev - 1))
                          }}
                          disabled={currentPage === 1 || loadingNodes}
                          className="h-6 px-2 text-xs"
                          type="button"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setCurrentPage(prev => Math.min(totalPages, prev + 1))
                          }}
                          disabled={currentPage === totalPages || loadingNodes}
                          className="h-6 px-2 text-xs"
                          type="button"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {selectedToNode && (
              <p className="text-xs text-muted-foreground">
                {getNodeLabel(selectedToNode)}
              </p>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-2">
            <Label>Properties</Label>
            {relationshipForm.properties.length > 0 && (
              <div className="space-y-2 mb-2">
                {relationshipForm.properties.map((prop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-xs font-mono flex-1">{prop.key}:</span>
                    <span className="text-xs text-muted-foreground">{String(prop.value)}</span>
                    <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => relationshipForm.handleRemoveProperty(index)}
                      className="h-6 w-6 p-0"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Property key"
                value={relationshipForm.newPropertyKey}
                onChange={(e) => relationshipForm.setNewPropertyKey(e.target.value)}
                className="flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    relationshipForm.handleAddProperty()
                  }
                }}
              />
              <Input
                placeholder="Value"
                value={relationshipForm.newPropertyValue}
                onChange={(e) => relationshipForm.setNewPropertyValue(e.target.value)}
                className="flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    relationshipForm.handleAddProperty()
                  }
                }}
              />
              <Select value={relationshipForm.newPropertyType} onValueChange={(v) => relationshipForm.setNewPropertyType(v as 'string' | 'number' | 'boolean')}>
                <SelectTrigger className="w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={relationshipForm.handleAddProperty}
                disabled={!relationshipForm.newPropertyKey.trim()}
                className="h-8 text-xs"
                type="button"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={relationshipForm.isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={relationshipForm.handleCreate} 
            disabled={!fromNodeId || !toNodeId || !relationshipType || relationshipForm.isSaving}
          >
            {relationshipForm.isSaving ? 'Creating...' : 'Create Relationship'}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Dialog for creating new relationship type */}
      <Dialog open={newRelationshipTypeDialogOpen} onOpenChange={setNewRelationshipTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Relationship Type</DialogTitle>
            <DialogDescription>
              Enter a new relationship type name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Relationship Type Name</Label>
              <Input
                placeholder="e.g., contains, refersTo"
                value={newRelationshipTypeInput}
                onChange={(e) => setNewRelationshipTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRelationshipTypeInput.trim()) {
                    const newType = newRelationshipTypeInput.trim()
                    setRelationshipType(newType)
                    // Refresh relationship types list (the new type will appear after it's used in a relationship)
                    refreshRelationshipTypes()
                    setNewRelationshipTypeInput('')
                    setNewRelationshipTypeDialogOpen(false)
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewRelationshipTypeDialogOpen(false)
              setNewRelationshipTypeInput('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newRelationshipTypeInput.trim()) {
                  const newType = newRelationshipTypeInput.trim()
                  setRelationshipType(newType)
                  // Refresh relationship types list (the new type will appear after it's used in a relationship)
                  refreshRelationshipTypes()
                  setNewRelationshipTypeInput('')
                  setNewRelationshipTypeDialogOpen(false)
                }
              }}
              disabled={!newRelationshipTypeInput.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Create Node Dialog (inline) */}
    <CreateNodeDialog
      open={createNodeDialogOpen}
      onOpenChange={(open) => {
        // Only manage the CreateNodeDialog state, don't affect the parent CreateRelationshipDialog
        setCreateNodeDialogOpen(open)
      }}
      onSuccess={async (createdNodeId) => {
        // After node creation, fetch the node details and add it to the list
        if (createdNodeId) {
          // Trigger node labels refresh event
          window.dispatchEvent(new CustomEvent('nodeLabelsChanged'))
          
          const newNode = await fetchNodeById(createdNodeId)
          
          if (newNode) {
            // Add the new node to the createdNodes list
            setCreatedNodes(prev => {
              // Check if node already exists to avoid duplicates
              const exists = prev.some(n => {
                const nId = n.nodeId || n.id
                return String(nId) === String(createdNodeId)
              })
              if (exists) return prev
              return [...prev, newNode]
            })
            
            // Use the last label (usually the most specific one)
            const nodeLabel = newNode.labels.length > 0 ? newNode.labels[newNode.labels.length - 1] : ''
            
            // Update the selected node label if we found a valid label
            if (nodeLabel) {
              if (!allNodeLabels.includes(nodeLabel)) {
                // Refresh node labels list to include the new label
                refreshNodeLabels()
              }
              handleSetSelectedNodeLabel(nodeLabel)
            }
            
            // Select the newly created node as the target
            setToNodeId(createdNodeId)
          } else {
            // Even if fetching fails, still select the node by ID
            setToNodeId(createdNodeId)
          }
          
          // Close only the CreateNodeDialog
          setCreateNodeDialogOpen(false)
        }
      }}
    />
    </>
  )
}

