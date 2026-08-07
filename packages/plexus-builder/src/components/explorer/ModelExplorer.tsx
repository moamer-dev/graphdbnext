'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import {
  Search,
  Plus,
  Trash2,
  Crown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Zap,
  Settings2,
  Sliders,
  Database,
  Layers,
  Sparkles,
  X,
  FileCode,
  Link as LinkIcon
} from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Node, Relationship, Property } from '../../types'
import { workflowRegistry } from '../../registry'

export const PREDEFINED_TOOLS = workflowRegistry.getAllTools().map(t => ({
  type: t.id,
  label: t.metadata.label,
  category: workflowRegistry.getToolCategory(t.metadata.category)?.label || t.metadata.category
}))

export const PREDEFINED_ACTIONS = workflowRegistry.getAllActions().map(a => ({
  type: a.id,
  label: a.metadata.label,
  category: workflowRegistry.getActionCategory(a.metadata.category)?.label || a.metadata.category
}))

interface ModelExplorerProps {
  className?: string
  onSwitchTab?: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
  onOpenSidebar?: () => void
}

export function ModelExplorer({ className, onSwitchTab, onOpenSidebar }: ModelExplorerProps) {
  const {
    nodes,
    relationships,
    selectedNode,
    selectNode,
    addNode,
    updateNode,
    deleteNode,
    addRelationship,
    deleteRelationship,
    selectRelationship,
    rootNodeId,
    setRootNodeId
  } = useModelBuilderStore()

  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  const addToolNode = useToolCanvasStore((state) => state.addNode)

  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const addActionNode = useActionCanvasStore((state) => state.addNode)

  // Cascading path of node IDs selected in the Miller Columns: [rootNodeId, childId, ...]
  const [cascadePath, setCascadePath] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Dialog state for adding new node
  const [addNodeDialogOpen, setAddNodeDialogOpen] = useState(false)
  const [newNodeLabel, setNewNodeLabel] = useState('')
  const [newNodeType, setNewNodeType] = useState('')

  // Dialog state for adding relationship from explorer column
  const [addRelDialogOpen, setAddRelDialogOpen] = useState(false)
  const [relFromId, setRelFromId] = useState<string>('')
  const [relToId, setRelToId] = useState<string>('')
  const [relType, setRelType] = useState('')

  // Dialog state for attaching tools & actions
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [attachTargetId, setAttachTargetId] = useState<string>('')
  const [attachSourceType, setAttachSourceType] = useState<'main-node' | 'tool'>('main-node')
  const [attachSourceHandle, setAttachSourceHandle] = useState<string>('tools')
  const [attachCategory, setAttachCategory] = useState<'tool' | 'action'>('tool')
  const [selectedToolType, setSelectedToolType] = useState('tool:if')
  const [selectedActionType, setSelectedActionType] = useState('action:set-property')

  // Sync cascadePath with selectedNode in store
  useEffect(() => {
    if (selectedNode && (!cascadePath.length || cascadePath[cascadePath.length - 1] !== selectedNode)) {
      if (!cascadePath.includes(selectedNode)) {
        setCascadePath([selectedNode])
      }
    } else if (!selectedNode && !cascadePath.length && nodes.length > 0) {
      const initialNode = rootNodeId ? nodes.find(n => n.id === rootNodeId)?.id || nodes[0].id : nodes[0].id
      setCascadePath([initialNode])
      selectNode(initialNode)
    }
  }, [selectedNode, nodes, rootNodeId])

  // Auto-scroll horizontally to rightmost column when cascade expands
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: 'smooth'
      })
    }
  }, [cascadePath.length])

  // Filtered node list for Column 1
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    const q = searchQuery.toLowerCase()
    return nodes.filter(n => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q))
  }, [nodes, searchQuery])

  // Handle column node click: updates cascade path at specific index
  const handleSelectNodeInColumn = (columnIndex: number, nodeId: string) => {
    const newPath = [...cascadePath.slice(0, columnIndex), nodeId]
    setCascadePath(newPath)
    selectNode(nodeId)
  }

  // Handle add node
  const handleCreateNode = () => {
    if (!newNodeLabel.trim() || !newNodeType.trim()) return
    const createdId = addNode({
      label: newNodeLabel.trim(),
      type: newNodeType.trim().toUpperCase(),
      properties: []
    })
    setNewNodeLabel('')
    setNewNodeType('')
    setAddNodeDialogOpen(false)
    setCascadePath([createdId])
    selectNode(createdId)
  }

  // Handle add property to a node
  const handleAddProperty = (nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return
    const updatedProps: Property[] = [
      ...targetNode.properties,
      {
        key: `property_${targetNode.properties.length + 1}`,
        type: 'string',
        required: false,
        defaultValue: ''
      }
    ]
    updateNode(nodeId, { properties: updatedProps })
  }

  // Handle property edit
  const handleUpdateProperty = (nodeId: string, propIndex: number, updates: Partial<Property>) => {
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return
    const updatedProps = targetNode.properties.map((p, idx) => idx === propIndex ? { ...p, ...updates } : p)
    updateNode(nodeId, { properties: updatedProps })
  }

  // Handle property delete
  const handleDeleteProperty = (nodeId: string, propIndex: number) => {
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return
    const updatedProps = targetNode.properties.filter((_, idx) => idx !== propIndex)
    updateNode(nodeId, { properties: updatedProps })
  }

  // Handle create relationship
  const handleCreateRelationship = () => {
    if (!relFromId || !relToId || !relType.trim()) return
    addRelationship({
      from: relFromId,
      to: relToId,
      type: relType.trim().toUpperCase()
    })
    setAddRelDialogOpen(false)
    setRelType('')
  }

  // Handle attach tool or action
  const handleAttachToolOrAction = () => {
    if (!attachTargetId) return
    selectRelationship(null)

    if (attachCategory === 'tool') {
      const toolDef = workflowRegistry.getTool(selectedToolType)
      const label = toolDef?.metadata.label || selectedToolType
      const defaultConfig = toolDef?.defaultConfig ? JSON.parse(JSON.stringify(toolDef.defaultConfig)) : {}

      let outputs: any[] = [{ id: 'output', label: 'Output' }]
      if (selectedToolType === 'tool:if') {
        outputs = [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]
      } else if (selectedToolType === 'tool:switch') {
        outputs = [
          { id: 'case_1', label: 'Case 1' },
          { id: 'default', label: 'Default' }
        ]
      }

      const toolId = addToolNode({
        type: selectedToolType as any,
        label,
        position: { x: 0, y: 0 },
        config: defaultConfig,
        inputs: 1,
        outputs
      })

      if (attachSourceType === 'main-node') {
        useToolCanvasStore.getState().updateNode(toolId, { targetNodeId: attachTargetId })
        useToolCanvasStore.getState().addEdge({
          source: attachTargetId,
          target: toolId,
          sourceHandle: 'tools',
          targetHandle: 'input'
        })
      } else {
        useToolCanvasStore.getState().addEdge({
          source: attachTargetId,
          target: toolId,
          sourceHandle: attachSourceHandle || 'output',
          targetHandle: 'input'
        })
      }

      useActionCanvasStore.getState().selectNode(null)
      useToolCanvasStore.getState().selectNode(toolId)
    } else {
      const actionDef = workflowRegistry.getAction(selectedActionType)
      const label = actionDef?.metadata.label || selectedActionType
      const defaultConfig = actionDef?.defaultConfig ? JSON.parse(JSON.stringify(actionDef.defaultConfig)) : {}

      const actionId = addActionNode({
        type: selectedActionType as any,
        label,
        position: { x: 0, y: 0 },
        config: defaultConfig
      })

      if (attachSourceType === 'main-node') {
        useActionCanvasStore.getState().addEdge({
          source: attachTargetId,
          target: actionId,
          sourceHandle: 'tools',
          targetHandle: 'input'
        })
      } else {
        useActionCanvasStore.getState().addEdge({
          source: attachTargetId,
          target: actionId,
          sourceHandle: attachSourceHandle || 'output',
          targetHandle: 'input'
        })
      }

      useToolCanvasStore.getState().selectNode(null)
      useActionCanvasStore.getState().selectNode(actionId)
    }

    setAttachDialogOpen(false)
    onOpenSidebar?.()
  }

  // Handle select existing tool/action to open settings sidebar
  const handleSelectTool = (toolId: string) => {
    selectRelationship(null)
    useActionCanvasStore.getState().selectNode(null)
    useToolCanvasStore.getState().selectNode(toolId)
    onOpenSidebar?.()
  }

  const handleSelectAction = (actionId: string) => {
    selectRelationship(null)
    useToolCanvasStore.getState().selectNode(null)
    useActionCanvasStore.getState().selectNode(actionId)
    onOpenSidebar?.()
  }

  return (
    <div className={cn("flex flex-col h-full bg-background select-none", className)}>
      {/* Explorer Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Miller Columns Explorer</span>
          </div>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {nodes.length} Nodes • {relationships.length} Relationships
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex items-center gap-1.5"
            onClick={() => setAddNodeDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Node</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex items-center gap-1.5"
            onClick={() => {
              if (cascadePath[0]) {
                setRelFromId(cascadePath[0])
                setAddRelDialogOpen(true)
              }
            }}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Add Relationship</span>
          </Button>
        </div>
      </div>

      {/* Columns Horizontal Scroll Container */}
      <div ref={containerRef} className="flex-1 flex overflow-x-auto divide-x divide-border/60 bg-muted/5">
        {/* Column 1: Node Master List */}
        <div className="w-72 shrink-0 flex flex-col h-full bg-background">
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All Nodes</span>
              <span className="text-[10px] text-muted-foreground">{filteredNodes.length}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter nodes..."
                className="pl-8 h-8 text-xs bg-muted/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {filteredNodes.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                No matching nodes found.
              </div>
            ) : (
              filteredNodes.map((node) => {
                const isSelected = cascadePath[0] === node.id
                const isRoot = rootNodeId === node.id
                const relCount = relationships.filter(r => r.from === node.id || r.to === node.id).length

                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNodeInColumn(0, node.id)}
                    className={cn(
                      "flex items-center justify-between p-3 text-xs cursor-pointer transition-colors group",
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary font-medium"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isRoot ? (
                        <span title="Root Node"><Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" /></span>
                      ) : (
                        <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium text-foreground">{node.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{node.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {relCount} rels
                      </span>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100", isSelected && "opacity-100 text-primary")} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Cascading Detail Columns (Column 2, Column 3, ...) */}
        {cascadePath.map((nodeId, columnIndex) => {
          const node = nodes.find(n => n.id === nodeId)
          if (!node) return null

          const isRoot = rootNodeId === node.id
          const nodeOutgoingRels = relationships.filter(r => r.from === node.id)
          const nodeIncomingRels = relationships.filter(r => r.to === node.id)

          // Tools attached to this node
          const attachedTools = toolNodes.filter(tn => {
            const edge = toolEdges.find(e => e.target === tn.id && e.source === node.id)
            return !!edge
          })

          // Actions attached to this node
          const attachedActions = actionNodes.filter(an => {
            const edge = actionEdges.find(e => e.target === an.id && e.source === node.id)
            return !!edge
          })

          const activeChildId = cascadePath[columnIndex + 1]

          return (
            <div key={`${node.id}-${columnIndex}`} className="w-80 shrink-0 flex flex-col h-full bg-background border-r">
              {/* Column Header */}
              <div className="p-3 border-b bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Level {columnIndex + 1}
                    </span>
                    {isRoot && (
                      <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-600 bg-amber-50 gap-1">
                        <Crown className="h-2.5 w-2.5" /> Root
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => setRootNodeId(isRoot ? null : node.id)}
                      title={isRoot ? "Unset Root Node" : "Set as Root Node"}
                    >
                      <Crown className={cn("h-3 w-3 mr-1", isRoot ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                      {isRoot ? "Root" : "Set Root"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        deleteNode(node.id)
                        setCascadePath(cascadePath.slice(0, columnIndex))
                      }}
                      title="Delete Node"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground truncate">{node.label}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                    {node.type}
                  </Badge>
                </div>
              </div>

              {/* Column Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* SECTION 1: PROPERTIES */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-blue-500" />
                      Properties ({node.properties.length})
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-1.5 text-primary"
                      onClick={() => handleAddProperty(node.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {node.properties.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/20 rounded">
                        No properties defined.
                      </p>
                    ) : (
                      node.properties.map((prop, pIdx) => (
                        <div key={pIdx} className="p-2 border rounded-md bg-muted/20 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={prop.key}
                              onChange={(e) => handleUpdateProperty(node.id, pIdx, { key: e.target.value })}
                              placeholder="key"
                              className="h-6 text-xs flex-1 bg-background font-mono"
                            />
                            <select
                              value={prop.type}
                              onChange={(e) => handleUpdateProperty(node.id, pIdx, { type: e.target.value as Property['type'] })}
                              className="h-6 text-[11px] border rounded px-1 bg-background"
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="date">date</option>
                              <option value="array">array</option>
                              <option value="object">object</option>
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => handleDeleteProperty(node.id, pIdx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION 2: RELATIONSHIPS (OUTGOING & INCOMING) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Relationships ({nodeOutgoingRels.length + nodeIncomingRels.length})
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-1.5 text-primary"
                      onClick={() => {
                        setRelFromId(node.id)
                        setAddRelDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {nodeOutgoingRels.map((rel) => {
                      const target = nodes.find(n => n.id === rel.to)
                      if (!target) return null
                      const isChildActive = activeChildId === target.id

                      return (
                        <div
                          key={rel.id}
                          onClick={() => handleSelectNodeInColumn(columnIndex + 1, target.id)}
                          className={cn(
                            "flex items-center justify-between p-2 border rounded-md text-xs cursor-pointer transition-colors group",
                            isChildActive ? "bg-accent border-primary/40 font-medium" : "hover:bg-muted/40 border-border"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className="text-[9px] font-mono shrink-0 border-border">
                              {rel.type}
                            </Badge>
                            <span className="truncate font-medium text-foreground">{target.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteRelationship(rel.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isChildActive && "text-primary")} />
                          </div>
                        </div>
                      )
                    })}

                    {nodeIncomingRels.map((rel) => {
                      const source = nodes.find(n => n.id === rel.from)
                      if (!source) return null
                      const isChildActive = activeChildId === source.id

                      return (
                        <div
                          key={rel.id}
                          onClick={() => handleSelectNodeInColumn(columnIndex + 1, source.id)}
                          className={cn(
                            "flex items-center justify-between p-2 border rounded-md text-xs cursor-pointer transition-colors group",
                            isChildActive ? "bg-accent border-primary/40 font-medium" : "hover:bg-muted/40 border-border"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className="text-[9px] font-mono shrink-0 border-border">
                              {rel.type}
                            </Badge>
                            <span className="truncate font-medium text-foreground">{source.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteRelationship(rel.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isChildActive && "text-primary")} />
                          </div>
                        </div>
                      )
                    })}

                    {nodeOutgoingRels.length === 0 && nodeIncomingRels.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/20 rounded">
                        No relationships connected.
                      </p>
                    )}
                  </div>
                </div>

                {/* SECTION 3: ATTACHED WORKFLOW TOOLS & ACTIONS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      Tools & Workflow ({attachedTools.length + attachedActions.length})
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-1.5 text-primary"
                      onClick={() => {
                        setAttachTargetId(node.id)
                        setAttachSourceType('main-node')
                        setAttachSourceHandle('tools')
                        setAttachDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Attach Tool
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* Attached Tools */}
                    {attachedTools.map((tool) => {
                      const renderToolItem = (toolNode: typeof tool, depth: number = 0): React.ReactNode => {
                        const isIfElse = toolNode.type === 'tool:if'
                        const isSwitch = toolNode.type === 'tool:switch'

                        // Actions connected to True and False handles
                        const trueActions = actionNodes.filter(an => {
                          const edge = actionEdges.find(e => e.source === toolNode.id && e.target === an.id && (e.sourceHandle === 'true' || !e.sourceHandle))
                          return !!edge
                        })
                        const falseActions = actionNodes.filter(an => {
                          const edge = actionEdges.find(e => e.source === toolNode.id && e.target === an.id && e.sourceHandle === 'false')
                          return !!edge
                        })

                        // Child tools connected to True and False handles
                        const trueChildTools = toolNodes.filter(tn => {
                          const edge = toolEdges.find(e => e.source === toolNode.id && e.target === tn.id && (e.sourceHandle === 'true' || !e.sourceHandle))
                          return !!edge
                        })
                        const falseChildTools = toolNodes.filter(tn => {
                          const edge = toolEdges.find(e => e.source === toolNode.id && e.target === tn.id && e.sourceHandle === 'false')
                          return !!edge
                        })

                        // Default output actions/tools for non-if/non-switch tools
                        const defaultOutputActions = actionNodes.filter(an => {
                          const edge = actionEdges.find(e => e.source === toolNode.id && e.target === an.id)
                          return !!edge
                        })
                        const defaultOutputTools = toolNodes.filter(tn => {
                          const edge = toolEdges.find(e => e.source === toolNode.id && e.target === tn.id)
                          return !!edge
                        })

                        return (
                          <div key={toolNode.id} className={cn("border rounded-md bg-muted/20 border-border overflow-hidden space-y-1.5 p-2", depth > 0 && "ml-2 border-l-2")}>
                            {/* Tool Header Card */}
                            <div
                              onClick={() => handleSelectTool(toolNode.id)}
                              className="flex items-center justify-between p-1.5 rounded bg-muted/50 hover:bg-muted/80 border border-border/60 cursor-pointer transition-colors group"
                              title="Click to configure tool settings"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-semibold text-xs text-foreground truncate">{toolNode.label}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge variant="outline" className="text-[9px] bg-background font-mono border-border">
                                  {isIfElse ? 'If / Else' : isSwitch ? 'Switch' : toolNode.type.replace('tool:', '')}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    useToolCanvasStore.getState().deleteNode(toolNode.id)
                                  }}
                                  title="Remove tool"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* IF / ELSE BRANCHES */}
                            {isIfElse ? (
                              <div className="space-y-2 pt-1">
                                {/* TRUE BRANCH (✓) */}
                                <div className="p-2 border rounded border-border/60 bg-muted/20 space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                      <Sparkles className="h-3 w-3 text-muted-foreground" /> True Branch (✓)
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 text-[10px] px-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                                      onClick={() => {
                                        setAttachTargetId(toolNode.id)
                                        setAttachSourceType('tool')
                                        setAttachSourceHandle('true')
                                        setAttachDialogOpen(true)
                                      }}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" /> Add Action/Tool
                                    </Button>
                                  </div>

                                  <div className="space-y-1">
                                    {trueActions.map((act) => (
                                      <div
                                        key={act.id}
                                        onClick={() => handleSelectAction(act.id)}
                                        className="flex items-center justify-between p-1.5 rounded bg-background border border-border hover:bg-muted/40 cursor-pointer text-[11px] group"
                                      >
                                        <div className="flex items-center gap-1 min-w-0">
                                          <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                                          <span className="truncate font-medium text-foreground">{act.label}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            useActionCanvasStore.getState().deleteNode(act.id)
                                          }}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    ))}

                                    {trueChildTools.map((ctool) => renderToolItem(ctool, depth + 1))}

                                    {trueActions.length === 0 && trueChildTools.length === 0 && (
                                      <p className="text-[10px] text-muted-foreground italic px-1">
                                        No actions attached to True branch.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* FALSE BRANCH (✗) */}
                                <div className="p-2 border rounded border-border/60 bg-muted/20 space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                      <X className="h-3 w-3 text-muted-foreground" /> False Branch (✗)
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 text-[10px] px-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                                      onClick={() => {
                                        setAttachTargetId(toolNode.id)
                                        setAttachSourceType('tool')
                                        setAttachSourceHandle('false')
                                        setAttachDialogOpen(true)
                                      }}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" /> Add Action/Tool
                                    </Button>
                                  </div>

                                  <div className="space-y-1">
                                    {falseActions.map((act) => (
                                      <div
                                        key={act.id}
                                        onClick={() => handleSelectAction(act.id)}
                                        className="flex items-center justify-between p-1.5 rounded bg-background border border-border hover:bg-muted/40 cursor-pointer text-[11px] group"
                                      >
                                        <div className="flex items-center gap-1 min-w-0">
                                          <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                                          <span className="truncate font-medium text-foreground">{act.label}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            useActionCanvasStore.getState().deleteNode(act.id)
                                          }}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    ))}

                                    {falseChildTools.map((ctool) => renderToolItem(ctool, depth + 1))}

                                    {falseActions.length === 0 && falseChildTools.length === 0 && (
                                      <p className="text-[10px] text-muted-foreground italic px-1">
                                        No actions attached to False branch.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : isSwitch ? (
                              /* SWITCH CASES BRANCHES */
                              <div className="space-y-2 pt-1">
                                {(toolNode.outputs && toolNode.outputs.length > 0 ? toolNode.outputs : [{ id: 'default', label: 'Default' }]).map((caseOut) => {
                                  const isDefaultCase = caseOut.id === 'default'
                                  const caseActions = actionNodes.filter(an => {
                                    const edge = actionEdges.find(e => e.source === toolNode.id && e.target === an.id && (e.sourceHandle === caseOut.id || (isDefaultCase && !e.sourceHandle)))
                                    return !!edge
                                  })
                                  const caseChildTools = toolNodes.filter(tn => {
                                    const edge = toolEdges.find(e => e.source === toolNode.id && e.target === tn.id && (e.sourceHandle === caseOut.id || (isDefaultCase && !e.sourceHandle)))
                                    return !!edge
                                  })

                                  return (
                                    <div
                                      key={caseOut.id}
                                      className="p-2 border rounded border-border/60 bg-muted/20 space-y-1.5 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                          <Layers className="h-3 w-3 text-muted-foreground" />
                                          {isDefaultCase ? 'Default Fallback' : `Case: ${caseOut.label}`}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-[10px] px-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                                          onClick={() => {
                                            setAttachTargetId(toolNode.id)
                                            setAttachSourceType('tool')
                                            setAttachSourceHandle(caseOut.id)
                                            setAttachDialogOpen(true)
                                          }}
                                        >
                                          <Plus className="h-2.5 w-2.5 mr-0.5" /> Add Action/Tool
                                        </Button>
                                      </div>

                                      <div className="space-y-1">
                                        {caseActions.map((act) => (
                                          <div
                                            key={act.id}
                                            onClick={() => handleSelectAction(act.id)}
                                            className="flex items-center justify-between p-1.5 rounded bg-background border border-border hover:bg-muted/40 cursor-pointer text-[11px] group"
                                          >
                                            <div className="flex items-center gap-1 min-w-0">
                                              <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                                              <span className="truncate font-medium text-foreground">{act.label}</span>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                useActionCanvasStore.getState().deleteNode(act.id)
                                              }}
                                            >
                                              <X className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        ))}

                                        {caseChildTools.map((ctool) => renderToolItem(ctool, depth + 1))}

                                        {caseActions.length === 0 && caseChildTools.length === 0 && (
                                          <p className="text-[10px] text-muted-foreground italic px-1">
                                            No actions attached to {isDefaultCase ? 'Default' : caseOut.label} branch.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              /* REGULAR TOOL OUTPUT BRANCH */
                              <div className="p-2 border rounded border-border/60 bg-muted/20 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-foreground">Output Actions</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-[10px] px-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => {
                                      setAttachTargetId(toolNode.id)
                                      setAttachSourceType('tool')
                                      setAttachSourceHandle('output')
                                      setAttachDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-0.5" /> Add Action/Tool
                                  </Button>
                                </div>

                                <div className="space-y-1">
                                  {defaultOutputActions.map((act) => (
                                    <div
                                      key={act.id}
                                      onClick={() => handleSelectAction(act.id)}
                                      className="flex items-center justify-between p-1.5 rounded bg-background border border-border hover:bg-muted/40 cursor-pointer text-[11px] group"
                                    >
                                      <div className="flex items-center gap-1 min-w-0">
                                        <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="truncate font-medium text-foreground">{act.label}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          useActionCanvasStore.getState().deleteNode(act.id)
                                        }}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  ))}

                                  {defaultOutputTools.map((ctool) => renderToolItem(ctool, depth + 1))}

                                  {defaultOutputActions.length === 0 && defaultOutputTools.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground italic px-1">
                                      No output actions or tools attached.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      return renderToolItem(tool, 0)
                    })}

                    {/* Direct Node Actions */}
                    {attachedActions.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleSelectAction(act.id)}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/20 border-border hover:bg-muted/50 text-xs cursor-pointer transition-colors group"
                        title="Click to configure action settings"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground truncate">{act.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-[9px] bg-background font-mono border-border">
                            Action
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation()
                              useActionCanvasStore.getState().deleteNode(act.id)
                            }}
                            title="Remove action"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {attachedTools.length === 0 && attachedActions.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/20 rounded">
                        No workflow tools or actions attached to this node.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Node Dialog */}
      <Dialog open={addNodeDialogOpen} onOpenChange={setAddNodeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="explorer-node-label" className="text-xs">Node Label</Label>
              <Input
                id="explorer-node-label"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="e.g. User, Order, Document"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="explorer-node-type" className="text-xs">Node Type</Label>
              <Input
                id="explorer-node-type"
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value)}
                placeholder="e.g. USER, ORDER, DOCUMENT"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateNode} disabled={!newNodeLabel.trim() || !newNodeType.trim()}>
              Create Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Relationship Dialog */}
      <Dialog open={addRelDialogOpen} onOpenChange={setAddRelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Relationship</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="rel-from-select" className="text-xs">From Node</Label>
              <select
                id="rel-from-select"
                value={relFromId}
                onChange={(e) => setRelFromId(e.target.value)}
                className="h-8 text-xs border rounded px-2 bg-background"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rel-type-input" className="text-xs">Relationship Type</Label>
              <Input
                id="rel-type-input"
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                placeholder="e.g. CONTAINS, HAS_PART, RELATES_TO"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rel-to-select" className="text-xs">To Node</Label>
              <select
                id="rel-to-select"
                value={relToId}
                onChange={(e) => setRelToId(e.target.value)}
                className="h-8 text-xs border rounded px-2 bg-background"
              >
                <option value="">-- Select Target Node --</option>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddRelDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRelationship} disabled={!relFromId || !relToId || !relType.trim()}>
              Create Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Tool or Action Dialog */}
      <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Attach Tool or Action</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-xs">
            <div className="grid gap-1.5">
              <Label className="text-xs">Category</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={attachCategory === 'tool' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                  onClick={() => setAttachCategory('tool')}
                >
                  <Wrench className="h-3.5 w-3.5 mr-1" /> Tool
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={attachCategory === 'action' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                  onClick={() => setAttachCategory('action')}
                >
                  <Zap className="h-3.5 w-3.5 mr-1" /> Action
                </Button>
              </div>
            </div>

            {attachCategory === 'tool' ? (
              <div className="grid gap-1.5">
                <Label htmlFor="select-tool-type" className="text-xs">Select Tool</Label>
                <select
                  id="select-tool-type"
                  value={selectedToolType}
                  onChange={(e) => setSelectedToolType(e.target.value)}
                  className="h-8 text-xs border rounded px-2 bg-background"
                >
                  {workflowRegistry.getGroupedTools().map(group => (
                    <optgroup key={group.category} label={group.config.label}>
                      {group.tools.map(t => (
                        <option key={t.id} value={t.id}>{t.metadata.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="select-action-type" className="text-xs">Select Action</Label>
                <select
                  id="select-action-type"
                  value={selectedActionType}
                  onChange={(e) => setSelectedActionType(e.target.value)}
                  className="h-8 text-xs border rounded px-2 bg-background"
                >
                  {workflowRegistry.getGroupedActions().map(group => (
                    <optgroup key={group.category} label={group.config.label}>
                      {group.actions.map(a => (
                        <option key={a.id} value={a.id}>{a.metadata.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAttachDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAttachToolOrAction}>
              Attach {attachCategory === 'tool' ? 'Tool' : 'Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
