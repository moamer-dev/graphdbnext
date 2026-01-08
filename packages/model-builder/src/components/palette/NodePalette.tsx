'use client'

import { useState, useMemo, useEffect, useRef, startTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { HelpCircle, Plus, Search, FolderPlus, GripVertical, X, Upload, FileText, Download } from 'lucide-react'
import { cn } from '../../utils/cn'
import { SortableNodeItem } from './SortableNodeItem'
import { NodeGroupComponent } from '../nodes/NodeGroup'
import { ConfirmDialog } from '../dialogs/ConfirmDialog'
import { generateNodeTemplate } from '../../services/parseService'
import { downloadFile } from '../../utils/exportUtils'
import { useBulkNodeParser, useNodePaletteSearch } from '../../hooks'
import { useNodePaletteDialogs } from '../../hooks/palette/useNodePaletteDialogs'
import type { Node, NodeGroup } from '../../types'
import { ToolsPaletteSection } from './sections/ToolsPaletteSection'
import { ActionsPaletteSection } from './sections/ActionsPaletteSection'
import { RelationshipsPaletteSection } from './sections/RelationshipsPaletteSection'

// Helper function to get color classes
function getColorClasses(color?: string, bgColor?: string) {
  if (!color || !bgColor) {
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      hoverBg: 'hover:bg-amber-100'
    }
  }
  
  const colorMap: Record<string, { text: string; bg: string; iconBg: string; border: string; hoverBorder: string; hoverBg: string }> = {
    'text-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-200', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-100' },
    'text-purple-600': { text: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100', border: 'border-purple-200', hoverBorder: 'hover:border-purple-300', hoverBg: 'hover:bg-purple-100' },
    'text-cyan-600': { text: 'text-cyan-600', bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', border: 'border-cyan-200', hoverBorder: 'hover:border-cyan-300', hoverBg: 'hover:bg-cyan-100' },
    'text-green-600': { text: 'text-green-600', bg: 'bg-green-50', iconBg: 'bg-green-100', border: 'border-green-200', hoverBorder: 'hover:border-green-300', hoverBg: 'hover:bg-green-100' },
    'text-teal-600': { text: 'text-teal-600', bg: 'bg-teal-50', iconBg: 'bg-teal-100', border: 'border-teal-200', hoverBorder: 'hover:border-teal-300', hoverBg: 'hover:bg-teal-100' },
    'text-pink-600': { text: 'text-pink-600', bg: 'bg-pink-50', iconBg: 'bg-pink-100', border: 'border-pink-200', hoverBorder: 'hover:border-pink-300', hoverBg: 'hover:bg-pink-100' },
    'text-indigo-600': { text: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', border: 'border-indigo-200', hoverBorder: 'hover:border-indigo-300', hoverBg: 'hover:bg-indigo-100' },
    'text-rose-600': { text: 'text-rose-600', bg: 'bg-rose-50', iconBg: 'bg-rose-100', border: 'border-rose-200', hoverBorder: 'hover:border-rose-300', hoverBg: 'hover:bg-rose-100' },
    'text-violet-600': { text: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100', border: 'border-violet-200', hoverBorder: 'hover:border-violet-300', hoverBg: 'hover:bg-violet-100' },
    'text-emerald-600': { text: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-300', hoverBg: 'hover:bg-emerald-100' },
    'text-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-100', border: 'border-orange-200', hoverBorder: 'hover:border-orange-300', hoverBg: 'hover:bg-orange-100' },
    'text-lime-600': { text: 'text-lime-600', bg: 'bg-lime-50', iconBg: 'bg-lime-100', border: 'border-lime-200', hoverBorder: 'hover:border-lime-300', hoverBg: 'hover:bg-lime-100' },
    'text-sky-600': { text: 'text-sky-600', bg: 'bg-sky-50', iconBg: 'bg-sky-100', border: 'border-sky-200', hoverBorder: 'hover:border-sky-300', hoverBg: 'hover:bg-sky-100' },
    'text-slate-600': { text: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100', border: 'border-slate-200', hoverBorder: 'hover:border-slate-300', hoverBg: 'hover:bg-slate-100' },
    'text-red-600': { text: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100', border: 'border-red-200', hoverBorder: 'hover:border-red-300', hoverBg: 'hover:bg-red-100' },
    'text-amber-600': { text: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-200', hoverBorder: 'hover:border-amber-300', hoverBg: 'hover:bg-amber-100' },
    'text-yellow-600': { text: 'text-yellow-600', bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', border: 'border-yellow-200', hoverBorder: 'hover:border-yellow-300', hoverBg: 'hover:bg-yellow-100' },
    'text-fuchsia-600': { text: 'text-fuchsia-600', bg: 'bg-fuchsia-50', iconBg: 'bg-fuchsia-100', border: 'border-fuchsia-200', hoverBorder: 'hover:border-fuchsia-300', hoverBg: 'hover:bg-fuchsia-100' },
    'text-gray-600': { text: 'text-gray-600', bg: 'bg-gray-50', iconBg: 'bg-gray-100', border: 'border-gray-200', hoverBorder: 'hover:border-gray-300', hoverBg: 'hover:bg-gray-100' }
  }
  
  return colorMap[color] || colorMap['text-amber-600']
}

interface NodePaletteProps {
  className?: string
  mode?: 'nodes' | 'relationships' | 'tools' | 'actions'
  onFocusNode?: (id: string) => void
  onFocusRelationship?: (fromNodeId: string, toNodeId: string) => void
}

export function NodePalette ({ className, mode = 'nodes', onFocusNode, onFocusRelationship }: NodePaletteProps) {
  const viewMode = mode
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const dialogs = useNodePaletteDialogs()
  const {
    nodeDialogOpen,
    setNodeDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    bulkAddDialogOpen,
    setBulkAddDialogOpen,
    deleteGroupDialogOpen,
    setDeleteGroupDialogOpen,
    deleteNodeDialogOpen,
    setDeleteNodeDialogOpen,
    label,
    setLabel,
    type,
    setType,
    groupId,
    setGroupId,
    groupName,
    setGroupName,
    bulkInput,
    setBulkInput,
    bulkImportFile,
    setBulkImportFile,
    pendingGroupId,
    setPendingGroupId,
    pendingGroupNodeCount,
    setPendingGroupNodeCount,
    pendingNodeId,
    bulkFileInputRef,
    handleAddNode,
    handleAddNodeToGroup,
    handleAddGroup,
    handleBulkAdd,
    handleBulkFileSelect,
    handleDeleteGroup,
    handleDeleteGroupWithNodes,
    handleDeleteGroupOnly,
    handleDeleteNode,
    handleConfirmDeleteNode
  } = dialogs
  
  // Search hook - only for nodes section (Tools and Actions sections handle their own search)
  const { searchQuery, setSearchQuery } = useNodePaletteSearch()

  // Drag and drop - keeping complex logic in component for now (group handling, etc.)
  const [activeId, setActiveId] = useState<string | null>(null)

  const nodes = useModelBuilderStore((state) => state.nodes)
  const groups = useModelBuilderStore((state) => state.groups)
  const selectedNode = useModelBuilderStore((state) => state.selectedNode)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const addNode = useModelBuilderStore((state) => state.addNode)
  const deleteNode = useModelBuilderStore((state) => state.deleteNode)
  const selectNode = useModelBuilderStore((state) => state.selectNode)
  const reorderNodes = useModelBuilderStore((state) => state.reorderNodes)
  const reorderUngroupedNodes = useModelBuilderStore((state) => state.reorderUngroupedNodes)
  const moveNodeToGroup = useModelBuilderStore((state) => state.moveNodeToGroup)
  const addGroup = useModelBuilderStore((state) => state.addGroup)
  const deleteGroup = useModelBuilderStore((state) => state.deleteGroup)
  const toggleGroup = useModelBuilderStore((state) => state.toggleGroup)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Require 8px of movement before drag starts
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Filter and sort nodes
  const { filteredNodes, groupedNodes, ungroupedNodes } = useMemo(() => {
    let filtered = nodes

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((node) =>
        node.label.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
      )
    }

    // Group nodes (no sorting - order is maintained by unifiedOrder)
    const grouped: Record<string, Node[]> = {}
    const ungrouped: Node[] = []

    filtered.forEach((node) => {
      if (node.groupId) {
        if (!grouped[node.groupId]) {
          grouped[node.groupId] = []
        }
        grouped[node.groupId].push(node)
      } else {
        ungrouped.push(node)
      }
    })

    return {
      filteredNodes: filtered,
      groupedNodes: grouped,
      ungroupedNodes: ungrouped
    }
  }, [nodes, searchQuery])


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Only nodes are draggable, not groups
    const activeIsGroup = groups.some((g) => g.id === active.id)
    if (activeIsGroup) {
      return // Don't allow dragging groups
    }
    
    const activeNode = nodes.find((n) => n.id === active.id)
    const overNode = nodes.find((n) => n.id === over.id)
    const overIsGroup = groups.some((g) => g.id === over.id)
    
    if (!activeNode) {
      return
    }
    
    // If dragging over a group, move node to that group
    if (overIsGroup) {
      moveNodeToGroup(active.id as string, over.id as string)
      return
    }
    
    // If dragging over an ungrouped node, move active node to ungrouped
    if (overNode && !overNode.groupId) {
      // If active node is in a group, move it out
      if (activeNode.groupId) {
        moveNodeToGroup(active.id as string, null)
        // Then reorder if needed
        setTimeout(() => {
          reorderUngroupedNodes(active.id as string, over.id as string)
        }, 0)
      } else {
        // Both are ungrouped - just reorder
        reorderUngroupedNodes(active.id as string, over.id as string)
      }
      return
    }
    
    // If dragging over a grouped node, move active node to that group
    if (overNode && overNode.groupId) {
      // If active node is already in the same group, just reorder
      if (activeNode.groupId === overNode.groupId) {
        reorderNodes(active.id as string, over.id as string)
      } else {
        // Move to different group
        moveNodeToGroup(active.id as string, overNode.groupId)
      }
      return
    }
    
    // Fallback: regular reordering
    if (activeNode && overNode) {
      if (!activeNode.groupId && !overNode.groupId) {
        reorderUngroupedNodes(active.id as string, over.id as string)
      } else {
        reorderNodes(active.id as string, over.id as string)
      }
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = generateNodeTemplate()
    downloadFile(csvContent, 'node-template.csv', 'text/csv;charset=utf-8;')
  }

  const { nodeCount } = useBulkNodeParser(bulkInput)


  // Scroll to selected node when it changes
  useEffect(() => {
    if (selectedNode && scrollContainerRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        // Try to find the node element by data attribute or id
        const nodeElement = scrollContainerRef.current?.querySelector(
          `[data-node-id="${selectedNode}"]`
        ) as HTMLElement
        
        if (nodeElement) {
          nodeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [selectedNode])


  // Create unified list: combine groups and ungrouped nodes, sort by order
  // Simple approach: both groups and nodes share the same order space
  const unifiedItems = useMemo(() => {
    const items: Array<{ type: 'group' | 'node'; id: string; order: number; data: Node | NodeGroup }> = []
    
    // Add groups with their order
    groups.forEach((group) => {
      items.push({ type: 'group', id: group.id, order: group.order, data: group })
    })
    
    // Add ungrouped nodes with their order
    // If a node doesn't have an order, assign one based on its index
    ungroupedNodes.forEach((node: Node, index: number) => {
      const order = node.order !== undefined ? node.order : (groups.length + index)
      items.push({ type: 'node', id: node.id, order, data: node })
    })
    
    // Sort by order to get unified order
    items.sort((a, b) => a.order - b.order)
    
    return items
  }, [groups, ungroupedNodes])

  return (
    <div className={`${className} flex flex-col h-full`}>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {viewMode === 'nodes' && (
          <div className="p-2 space-y-2 shrink-0">
            {/* Search - only show for nodes */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

        {/* Add Group and Add Node Buttons - only show for nodes */}
        {viewMode === 'nodes' && (
          <div className="flex gap-2">
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border border-dashed border-border/60 shadow-sm hover:shadow text-muted-foreground hover:text-foreground">
                  <FolderPlus className="h-3.5 w-3.5" />
                  Add Group
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Group</DialogTitle>
                  <DialogDescription>
                    Create a group to organize your nodes.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., Core Entities"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddGroup()
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setGroupDialogOpen(false)
                      setGroupName('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddGroup}
                    disabled={!groupName.trim()}
                  >
                    Add Group
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border border-dashed border-border/60 shadow-sm hover:shadow text-muted-foreground hover:text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  Add Node
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
            <TooltipProvider>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
                <DialogDescription>
                  Enter the label and type for the new node.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="label">Node Label</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            The display name for the node (e.g., &quot;Person&quot;, &quot;Book&quot;, &quot;Author&quot;)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="label"
                    placeholder="e.g., Person"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNode()
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="type">Node Type</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            The type identifier for the node, typically matching the label (e.g., &quot;Person&quot;, &quot;Book&quot;)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="type"
                    placeholder="e.g., Person"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNode()
                      }
                    }}
                  />
                </div>
                {groups.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="group">Group (Optional)</Label>
                    <Select value={groupId || 'none'} onValueChange={(value) => setGroupId(value === 'none' ? '' : value)}>
                      <SelectTrigger id="group">
                        <SelectValue placeholder="No group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNodeDialogOpen(false)
                    setLabel('')
                    setType('')
                    setGroupId('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => handleAddNode()}
                  disabled={!label.trim() || !type.trim()}
                >
                  Add Node
                </Button>
              </DialogFooter>
            </TooltipProvider>
          </DialogContent>
            </Dialog>
          </div>
            )}
            {/* Bulk Add Button - only show for nodes */}
            {viewMode === 'nodes' && (
              <button
                onClick={() => setBulkAddDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border border-dashed border-border/60 shadow-sm hover:shadow text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-3.5 w-3.5" />
                Bulk Add
              </button>
            )}

            {/* Groups and Nodes header - only show when nodes tab is active */}
            {viewMode === 'nodes' && (groups.length > 0 || ungroupedNodes.length > 0) && (
              <div className="mt-4 shrink-0">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/40">
                  Nodes ({filteredNodes.length})
                </div>
              </div>
            )}
          </div>
        )}
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'nodes' && (groups.length > 0 || ungroupedNodes.length > 0) && (
          <div className="p-2 pt-0 pr-1">
            <div ref={scrollContainerRef} className="mt-2 space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={[
                    ...unifiedItems.map((item) => item.id),
                    ...Object.values(groupedNodes).flat().map((node: Node) => node.id)
                  ]}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Groups (not draggable) and Ungrouped Nodes (draggable) */}
                  {unifiedItems.map((item) => {
                    if (item.type === 'group') {
                      const group = item.data as NodeGroup
                      const groupNodes = groupedNodes[group.id] || []
                      return (
                        <NodeGroupComponent
                          key={group.id}
                          group={group}
                          nodes={groupNodes}
                          selectedNode={selectedNode}
                          searchQuery={searchQuery}
                          rootNodeId={rootNodeId}
                          onSelectNode={(id) => {
                            selectNode(id)
                            onFocusNode?.(id)
                          }}
                          onDeleteNode={deleteNode}
                          onToggleGroup={toggleGroup}
                          onDeleteGroup={handleDeleteGroup}
                          onReorderNodes={reorderNodes}
                          onAddNodeToGroup={handleAddNodeToGroup}
                        />
                      )
                    } else {
                      const node = item.data as Node
                      return (
                        <SortableNodeItem
                          key={node.id}
                          node={node}
                          selected={selectedNode === node.id}
                          isRoot={rootNodeId === node.id}
                          onSelect={() => {
                            selectNode(node.id)
                            onFocusNode?.(node.id)
                          }}
                          onDelete={() => handleDeleteNode(node.id)}
                        />
                      )
                    }
                  })}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    (() => {
                      // Only nodes are draggable, not groups
                      const activeNode = nodes.find((n) => n.id === activeId)
                      if (activeNode) {
                        return (
                          <div className="group flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg bg-card border-2 border-primary shadow-lg opacity-95 min-w-[200px]">
                            <div className="shrink-0 text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate text-foreground">{activeNode.label}</div>
                              <div className="text-muted-foreground truncate text-[10px]">{activeNode.type}</div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()
                  ) : null}
                </DragOverlay>
              </DndContext>

              {filteredNodes.length === 0 && searchQuery && (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No nodes match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Relationships Section - only show when relationships tab is active */}
        {viewMode === 'relationships' && (
          <RelationshipsPaletteSection
            scrollContainerRef={scrollContainerRef}
            onFocusRelationship={onFocusRelationship}
          />
        )}

        {/* Tools Section - only show when tools tab is active */}
        {viewMode === 'tools' && (
          <ToolsPaletteSection />
        )}

        {/* Actions Section - only show when actions tab is active */}
        {viewMode === 'actions' && (
          <ActionsPaletteSection />
        )}
      </div>
      </div>
      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bulk Add Nodes</DialogTitle>
            <DialogDescription>
              Add multiple nodes at once. Use one of these formats:
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
              <li>One per line: <code className="bg-muted px-1 rounded">label:type</code> or <code className="bg-muted px-1 rounded">label,type</code></li>
              <li>With group: <code className="bg-muted px-1 rounded">label:type:groupName</code> or <code className="bg-muted px-1 rounded">label,type,groupName</code></li>
              <li>CSV format: <code className="bg-muted px-1 rounded">label,type</code> (supports CSV file import)</li>
              <li>Single word: will be used as both label and type</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-file">Import from CSV/TXT file (optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-xs h-7"
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Download Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="text-xs h-7"
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Choose File
                  </Button>
                </div>
              </div>
              <Input
                id="bulk-file"
                ref={bulkFileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleBulkFileSelect}
                className="hidden"
              />
              {bulkImportFile && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {bulkImportFile.name}
                  <button
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkInput('')
                      if (bulkFileInputRef.current) {
                        bulkFileInputRef.current.value = ''
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-input">Node List</Label>
              <textarea
                id="bulk-input"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Person:Entity&#10;Company:Entity&#10;Product:Entity&#10;&#10;Or CSV format:&#10;Person,Entity&#10;Company,Entity&#10;Product,Entity"
                className="w-full h-64 p-3 text-xs border rounded-md font-mono resize-none"
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                {nodeCount} node(s) will be created
              </p>
            </div>
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bulk-group">Default Group (optional)</Label>
                <Select
                  value={groupId || 'none'}
                  onValueChange={setGroupId}
                >
                  <SelectTrigger id="bulk-group" className="h-8 text-xs">
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Nodes will be added to this group unless specified in the input (e.g., label:type:groupName)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkAddDialogOpen(false)
                setBulkInput('')
                setBulkImportFile(null)
                if (bulkFileInputRef.current) {
                  bulkFileInputRef.current.value = ''
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim() && !bulkImportFile}
            >
              Add Nodes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <AlertDialogContent className="max-w-2xl w-[90vw] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              The group &quot;{groups.find(g => g.id === pendingGroupId)?.name}&quot; contains {pendingGroupNodeCount} node{pendingGroupNodeCount !== 1 ? 's' : ''}. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel 
              onClick={() => {
                setPendingGroupId(null)
                setPendingGroupNodeCount(0)
              }}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDeleteGroupOnly}
              className="w-full sm:w-auto order-2 whitespace-normal text-xs sm:text-sm"
            >
              Delete and keep {pendingGroupNodeCount} Node{pendingGroupNodeCount !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroupWithNodes}
              className="w-full sm:w-auto bg-destructive text-white hover:bg-destructive/90 order-1 sm:order-3 whitespace-normal text-xs sm:text-sm"
            >
              Delete Entire Group
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Node Confirmation Dialog */}
      <ConfirmDialog
        open={deleteNodeDialogOpen}
        onOpenChange={setDeleteNodeDialogOpen}
        title="Delete Node"
        description={
          pendingNodeId
            ? `Are you sure you want to delete "${nodes.find((n) => n.id === pendingNodeId)?.label || 'this node'}"? This action cannot be undone.`
            : 'Are you sure you want to delete this node?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteNode}
        variant="destructive"
      />
    </div>
  )
}
