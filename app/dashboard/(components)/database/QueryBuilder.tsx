'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { NodeQueries, RelationshipQueries } from '@/lib/queries/cypherQueries'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, X, Play, ArrowRight, Check, ChevronDown, GripVertical } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useQueryBuilder, operators, QueryConditionType } from '../../hooks/query/useQueryBuilder'
import { QueryRelationship, QueryNode } from '@/lib/services/QueryBuilderService'

interface QueryBuilderProps {
  onQueryGenerate: (query: string) => void
  onExecute?: (query: string) => void
  initialCypherQuery?: string
}

interface ConditionPropertySelectProps {
  condition: QueryConditionType
  matchNodes: QueryNode[]
  updateCondition: (id: string, updates: Partial<QueryConditionType>) => void
  fetchPropertiesForLabel: (label?: string) => Promise<string[]>
  loadingPropertiesForLabel: Record<string, boolean>
  removeCondition: (id: string) => void
}

function ConditionPropertySelect({ condition, matchNodes, updateCondition, fetchPropertiesForLabel, loadingPropertiesForLabel, removeCondition }: ConditionPropertySelectProps) {
  const [properties, setProperties] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const selectedNode = matchNodes.find(n => n.id === condition.nodeId)
  const nodeLabel = selectedNode?.label
  const isLoading = nodeLabel ? (loadingPropertiesForLabel[nodeLabel] || false) : false

  useEffect(() => {
    const loadProperties = async () => {
      if (!nodeLabel) {
        setProperties([])
        return
      }

      setLoading(true)
      const props = await fetchPropertiesForLabel(nodeLabel)
      setProperties(props)
      setLoading(false)
    }

    loadProperties()
  }, [nodeLabel, fetchPropertiesForLabel])

  return (
    <div className="flex flex-col gap-2 p-1.5 border rounded text-xs">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <Select
          value={condition.nodeId || undefined}
          onValueChange={(nodeId) => {
            // When node changes, clear property as we'll fetch new properties for the new node
            updateCondition(condition.id, {
              nodeId,
              property: undefined
            })
          }}
        >
          <SelectTrigger className="h-7 text-xs flex-1 min-w-[100px]">
            <SelectValue placeholder="Node..." />
          </SelectTrigger>
          <SelectContent>
            {matchNodes.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.label || 'Any'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground shrink-0">.</span>

        <Select
          value={condition.property || undefined}
          onValueChange={(value) => {
            updateCondition(condition.id, { property: value })
          }}
          disabled={!condition.nodeId || loading || isLoading}
        >
          <SelectTrigger className="h-7 text-xs flex-1 min-w-[100px]">
            <SelectValue placeholder={
              !condition.nodeId
                ? "Property..."
                : loading || isLoading
                  ? "Loading..."
                  : properties.length > 0
                    ? "Property..."
                    : nodeLabel
                      ? `No properties for ${nodeLabel}`
                      : "Select a node first"
            } />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {properties.length > 0 ? (
              properties.map(key => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {loading || isLoading
                  ? "Loading properties..."
                  : nodeLabel
                    ? `No properties found for ${nodeLabel}`
                    : "Select a node first"}
              </div>
            )}
          </SelectContent>
        </Select>

        <Select
          value={condition.operator || '='}
          onValueChange={(value) => updateCondition(condition.id, { operator: value })}
        >
          <SelectTrigger className="h-7 text-xs min-w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map(op => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="h-7 text-xs flex-1 min-w-[100px]"
          placeholder="value"
        />
      </div>

      <Button
        onClick={() => removeCondition(condition.id)}
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 shrink-0 self-end"
        type="button"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface RelationshipTypeSelectProps {
  relationship: QueryRelationship
  matchNodes: QueryNode[]
  onTypeChange: (type: string) => void
  fetchRelationshipTypes: (fromLabel?: string, toLabel?: string) => Promise<string[]>
}

function RelationshipTypeSelect({ relationship, matchNodes, onTypeChange, fetchRelationshipTypes }: RelationshipTypeSelectProps) {
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fromNode = matchNodes.find(n => n.id === relationship.from)
  const toNode = matchNodes.find(n => n.id === relationship.to)

  useEffect(() => {
    const loadTypes = async () => {
      setLoading(true)
      const types = await fetchRelationshipTypes(fromNode?.label, toNode?.label)
      setRelationshipTypes(types)
      setLoading(false)
    }

    if (fromNode || toNode) {
      loadTypes()
    } else {
      // Use setTimeout to avoid synchronous setState
      setTimeout(() => setRelationshipTypes([]), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromNode?.label, toNode?.label, fetchRelationshipTypes])

  return (
    <Select
      value={relationship.type || '__none__'}
      onValueChange={onTypeChange}
    >
      <SelectTrigger className="h-7 text-xs flex-1 min-w-[120px]">
        <SelectValue placeholder={loading ? "Loading..." : "Any type"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Any type</SelectItem>
        {relationshipTypes.map(type => (
          <SelectItem key={type} value={type}>{type}</SelectItem>
        ))}
        {!loading && relationshipTypes.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No relationships found</div>
        )}
      </SelectContent>
    </Select>
  )
}

interface MultiSelectNodesProps {
  nodeLabels: string[]
  selectedLabels: string[]
  onSelect: (labels: string[]) => void
  onClose?: () => void
}

function MultiSelectNodes({ nodeLabels, selectedLabels, onSelect, onClose }: MultiSelectNodesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filteredLabels = useMemo(() => {
    if (!searchQuery) return nodeLabels
    return nodeLabels.filter(label =>
      label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [nodeLabels, searchQuery])

  const handleToggle = (label: string) => {
    // Don't allow selecting already added nodes
    if (selectedLabels.includes(label)) return

    const newSelected = new Set(selected)
    if (newSelected.has(label)) {
      newSelected.delete(label)
    } else {
      newSelected.add(label)
    }
    setSelected(newSelected)
  }

  const handleAdd = () => {
    const labelsToAdd = Array.from(selected).filter(label => !selectedLabels.includes(label))
    if (labelsToAdd.length > 0) {
      onSelect(labelsToAdd)
      setSelected(new Set())
      onClose?.()
    }
  }

  return (
    <div className="p-2">
      <Command>
        <CommandInput
          placeholder="Search node types..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No node types found.</CommandEmpty>
          <CommandGroup>
            {filteredLabels.map(label => {
              const isSelected = selected.has(label)
              const isAlreadyAdded = selectedLabels.includes(label)
              return (
                <CommandItem
                  key={label}
                  value={label}
                  onSelect={() => handleToggle(label)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    {!isAlreadyAdded && (
                      <div className={`h-4 w-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    )}
                    <span className={isAlreadyAdded ? 'text-muted-foreground line-through' : ''}>{label}</span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
      <div className="flex items-center justify-between pt-2 border-t mt-2">
        <div className="text-xs text-muted-foreground">
          {selected.size > 0 && `${selected.size} selected`}
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={selected.size === 0 || Array.from(selected).every(l => selectedLabels.includes(l))}
          className="h-7 text-xs"
        >
          Add Selected
        </Button>
      </div>
    </div>
  )
}

export function QueryBuilder({ onQueryGenerate, onExecute, initialCypherQuery }: QueryBuilderProps) {
  const {
    matchNodes,
    matchRelationships,
    conditions,
    returnFields,
    limit,
    limitMode,
    setLimitMode,
    popoverOpen,
    draggedFieldIndex,
    dragOverIndex,
    draggedNodeIndex,
    dragOverNodeIndex,
    setReturnFields,
    setLimit,
    setPopoverOpen,
    setDraggedFieldIndex,
    setDragOverIndex,
    setDraggedNodeIndex,
    setDragOverNodeIndex,
    addMultipleNodes,
    removeNode,
    reorderNodes,
    addRelationship,
    removeRelationship,
    updateRelationship,
    addCondition,
    removeCondition,
    updateCondition,
    handleExecute,
    generateQuery
  } = useQueryBuilder({ onQueryGenerate, onExecute, initialCypherQuery })

  const [nodeLabels, setNodeLabels] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [relationshipTypesCache, setRelationshipTypesCache] = useState<Record<string, string[]>>({})
  const [propertiesCache, setPropertiesCache] = useState<Record<string, string[]>>({})
  const [loadingPropertiesForLabel, setLoadingPropertiesForLabel] = useState<Record<string, boolean>>({})

  // Fetch properties for a specific node label dynamically from the graph
  const fetchPropertiesForLabel = useCallback(async (label?: string): Promise<string[]> => {
    if (!label) return []

    const cacheKey = label

    // Return cached if available
    if (propertiesCache[cacheKey]) {
      return propertiesCache[cacheKey]
    }

    // Set loading state
    setLoadingPropertiesForLabel(prev => ({ ...prev, [cacheKey]: true }))

    try {
      // Fetch all distinct property keys for nodes with this label
      const query = NodeQueries.getPropertiesByLabel(label)

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      const properties: string[] = []

      if (data.success && data.results) {
        data.results.forEach((result: { key: string }) => {
          if (result.key) {
            properties.push(result.key)
          }
        })
      }

      // Cache the result
      setPropertiesCache(prev => ({ ...prev, [cacheKey]: properties }))
      return properties
    } catch (error) {
      console.error('Error fetching properties for label:', error)
      return []
    } finally {
      setLoadingPropertiesForLabel(prev => {
        const updated = { ...prev }
        delete updated[cacheKey]
        return updated
      })
    }
  }, [propertiesCache])

  // Fetch relationship types between two node labels
  const fetchRelationshipTypes = useCallback(async (fromLabel?: string, toLabel?: string): Promise<string[]> => {
    const cacheKey = `${fromLabel || 'any'}-${toLabel || 'any'}`

    // Return cached if available
    if (relationshipTypesCache[cacheKey]) {
      return relationshipTypesCache[cacheKey]
    }


    try {
      let query = ''

      if (fromLabel && toLabel) {
        query = RelationshipQueries.getTypesByLabels(fromLabel, toLabel)
      } else if (fromLabel) {
        query = RelationshipQueries.getTypesByFromLabel(fromLabel)
      } else {
        query = RelationshipQueries.getAllTypes()
      }

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      const types: string[] = []

      if (data.success && data.results) {
        data.results.forEach((result: { relationshipType: string }) => {
          if (result.relationshipType) {
            types.push(result.relationshipType)
          }
        })
      }

      // Cache the result
      setRelationshipTypesCache(prev => ({ ...prev, [cacheKey]: types }))
      return types
    } catch (error) {
      console.error('Error fetching relationship types:', error)
      return []
    }
  }, [relationshipTypesCache])

  // Fetch all node labels on mount and when refresh is triggered
  useEffect(() => {
    const fetchNodeLabels = async () => {
      try {
        const query = NodeQueries.getAllLabels()

        const response = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const data = await response.json()
        if (data.success && data.results) {
          const labels = data.results.map((result: { label: string }) => result.label)
          setNodeLabels(labels)
        }
      } catch (error) {
        console.error('Error fetching node labels:', error)
      }
    }

    fetchNodeLabels()
  }, [refreshTrigger])

  // Listen for node creation/deletion events
  useEffect(() => {
    const handleNodeChange = () => {
      setRefreshTrigger(prev => prev + 1)
    }

    window.addEventListener('nodeLabelsChanged', handleNodeChange)
    return () => {
      window.removeEventListener('nodeLabelsChanged', handleNodeChange)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Visual Query Builder</Label>
        <p className="text-xs text-muted-foreground">Build Cypher queries visually without writing code</p>
      </div>

      <div className="space-y-6">
        {/* MATCH Nodes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold">Match Nodes</Label>
            <div className="flex items-center gap-2">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Select Nodes
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="end">
                  <MultiSelectNodes
                    nodeLabels={nodeLabels}
                    selectedLabels={matchNodes.map(n => n.label).filter(Boolean) as string[]}
                    onSelect={(labels) => {
                      if (labels.length > 0) {
                        addMultipleNodes(labels)
                      }
                    }}
                    onClose={() => setPopoverOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {matchNodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matchNodes.map((node, index) => {
                const isDragging = draggedNodeIndex === index
                const isDragOver = dragOverNodeIndex === index && draggedNodeIndex !== null && draggedNodeIndex !== index
                return (
                  <Badge
                    key={node.id}
                    variant="secondary"
                    className={`text-xs pr-1 flex items-center gap-1 transition-all ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-move'
                      } ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedNodeIndex(index)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', index.toString())
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.dataTransfer.dropEffect = 'move'
                      if (draggedNodeIndex !== null && draggedNodeIndex !== index) {
                        setDragOverNodeIndex(index)
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverNodeIndex(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                      if (draggedIndex !== index && !isNaN(draggedIndex)) {
                        reorderNodes(draggedIndex, index)
                      }
                      setDraggedNodeIndex(null)
                      setDragOverNodeIndex(null)
                    }}
                    onDragEnd={() => {
                      setDraggedNodeIndex(null)
                      setDragOverNodeIndex(null)
                    }}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <span>
                      {node.label || 'Any'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNode(node.id)
                      }}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* MATCH Relationships */}
        {matchNodes.length >= 2 && (
          <div>
            <div className="mb-3">
              <Label className="text-sm font-semibold">Relationships</Label>
            </div>
            <div className="space-y-1.5">
              {matchRelationships.map((rel, relIndex) => {
                return (
                  <div key={rel.id} className={`flex flex-col gap-2 p-1.5 border rounded text-xs ${rel.enabled === false ? 'opacity-50' : ''}`}>
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between pb-1 border-b">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rel.enabled !== false}
                          onCheckedChange={(checked) => updateRelationship(rel.id, { enabled: checked })}
                          className="h-4 w-7"
                        />
                        <Label className="text-[10px] text-muted-foreground cursor-pointer" onClick={() => updateRelationship(rel.id, { enabled: rel.enabled === false })}>
                          {rel.enabled === false ? 'Disabled' : 'Enabled'}
                        </Label>
                      </div>
                    </div>

                    {/* Match Type Selector - show between relationships */}
                    {relIndex > 0 && (
                      <div className="flex items-center gap-2 pb-1 border-b">
                        <Label className="text-[10px] text-muted-foreground shrink-0">Combine with:</Label>
                        <Select
                          value={rel.matchType || 'OPTIONAL_MATCH'}
                          onValueChange={(value) => updateRelationship(rel.id, { matchType: value as 'AND' | 'OR' | 'MATCH' | 'OPTIONAL_MATCH' })}
                        >
                          <SelectTrigger className="h-6 text-xs flex-1 min-w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND (comma in MATCH)</SelectItem>
                            <SelectItem value="OPTIONAL_MATCH">OPTIONAL MATCH</SelectItem>
                            <SelectItem value="MATCH">Separate MATCH</SelectItem>
                            <SelectItem value="OR">OR (union)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <Select
                        value={rel.from}
                        onValueChange={(value) => updateRelationship(rel.id, { from: value })}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1 min-w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {matchNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.label || 'Any'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                      <RelationshipTypeSelect
                        relationship={rel}
                        matchNodes={matchNodes}
                        onTypeChange={(type) => updateRelationship(rel.id, { type: type === '__none__' ? undefined : type })}
                        fetchRelationshipTypes={fetchRelationshipTypes}
                      />

                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                      <Select
                        value={rel.to}
                        onValueChange={(value) => updateRelationship(rel.id, { to: value })}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1 min-w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {matchNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.label || 'Any'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => removeRelationship(rel.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 shrink-0 self-end"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <Button
              onClick={addRelationship}
              size="sm"
              variant="outline"
              className="h-7 text-xs mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Relationship
            </Button>
            {matchRelationships.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Note: Relationship direction matters. From Node → To Node means the relationship goes from the first node to the second.
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* WHERE Conditions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-sm font-semibold">Conditions (WHERE)</Label>
          </div>
          <div className="space-y-1.5">
            {conditions.map((cond) => (
              <ConditionPropertySelect
                key={cond.id}
                condition={cond}
                matchNodes={matchNodes}
                updateCondition={updateCondition}
                fetchPropertiesForLabel={fetchPropertiesForLabel}
                loadingPropertiesForLabel={loadingPropertiesForLabel}
                removeCondition={removeCondition}
              />
            ))}
          </div>
          <Button
            onClick={addCondition}
            size="sm"
            variant="outline"
            className="h-7 text-xs mt-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>

        <Separator />

        {/* RETURN & LIMIT */}
        {matchNodes.length > 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Return Fields</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Fields
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="end">
                    <div className="p-2">
                      <Command>
                        <CommandInput placeholder="Search nodes..." />
                        <CommandList>
                          <CommandEmpty>No nodes found.</CommandEmpty>
                          <CommandGroup>
                            {matchNodes.map((node, index) => {
                              const isSelected = returnFields.includes(index.toString())
                              const label = node.label || 'Any'
                              return (
                                <CommandItem
                                  key={node.id}
                                  value={`node-${index}-${label}`}
                                  onSelect={() => {
                                    if (isSelected) {
                                      setReturnFields(returnFields.filter((f: string) => f !== index.toString()))
                                    } else {
                                      // Only add if not already present (prevent duplicates)
                                      const indexStr = index.toString()
                                      if (!returnFields.includes(indexStr)) {
                                        setReturnFields([...returnFields, indexStr])
                                      }
                                    }
                                  }}
                                  className={isSelected ? "cursor-pointer opacity-50" : "cursor-pointer"}
                                  disabled={isSelected}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {!isSelected && (
                                      <div className="h-4 w-4 border rounded flex items-center justify-center border-muted-foreground">
                                      </div>
                                    )}
                                    <span className={isSelected ? 'text-muted-foreground line-through' : ''}>
                                      {node.label || 'Any'}
                                    </span>
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {returnFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {returnFields.map((fieldIndex, badgeIndex) => {
                    const index = parseInt(fieldIndex)
                    const node = matchNodes[index]
                    if (!node) return null
                    const isDragging = draggedFieldIndex === badgeIndex
                    const isDragOver = dragOverIndex === badgeIndex && draggedFieldIndex !== null && draggedFieldIndex !== badgeIndex
                    return (
                      <Badge
                        key={fieldIndex}
                        variant="secondary"
                        className={`text-xs pr-1 flex items-center gap-1 transition-all ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-move'
                          } ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        draggable
                        onDragStart={(e) => {
                          setDraggedFieldIndex(badgeIndex)
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', badgeIndex.toString())
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                          if (draggedFieldIndex !== null && draggedFieldIndex !== badgeIndex) {
                            setDragOverIndex(badgeIndex)
                          }
                        }}
                        onDragLeave={() => {
                          setDragOverIndex(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                          if (draggedIndex !== badgeIndex && !isNaN(draggedIndex)) {
                            const newFields = [...returnFields]
                            const [removed] = newFields.splice(draggedIndex, 1)
                            newFields.splice(badgeIndex, 0, removed)
                            setReturnFields(newFields)
                          }
                          setDraggedFieldIndex(null)
                          setDragOverIndex(null)
                        }}
                        onDragEnd={() => {
                          setDraggedFieldIndex(null)
                          setDragOverIndex(null)
                        }}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <span>
                          {node.label || 'Any'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setReturnFields(returnFields.filter((f: string) => f !== fieldIndex))
                          }}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
              {returnFields.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Select which nodes to return in the query results
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold mb-2 block">Limit</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="h-8 text-xs flex-1"
                  placeholder="10"
                />
                <Select value={limitMode} onValueChange={(value: 'rows' | 'nodes') => setLimitMode(value)}>
                  <SelectTrigger className="h-8 text-xs w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rows">Limit Rows</SelectItem>
                    <SelectItem value="nodes">Limit Nodes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {limitMode === 'rows'
                  ? 'Limits the number of result rows (relationship instances)'
                  : 'Limits the number of distinct nodes, then returns all their relationships'}
              </p>
            </div>
          </div>
        )}

        {/* Generated Query Preview */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Generated Query</Label>
          <div className="p-3 bg-muted rounded-md border">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {generateQuery()}
            </pre>
          </div>
        </div>

        {/* Actions */}
        {onExecute && (
          <div className="flex gap-2">
            <Button
              onClick={handleExecute}
              className="flex-1 text-xs"
            >
              <Play className="h-3 w-3 mr-1.5" />
              Execute
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

