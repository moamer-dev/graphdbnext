'use client'

import { useState, useCallback } from 'react'
import { X, Edit2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { GraphNode, GraphEdge } from '@/lib/services/GraphVisualizationService'
import { PropertyEditor } from './PropertyEditor'
import { CreateRelationshipDialog } from './CreateRelationshipDialog'
import { useMutation } from '../../hooks/database/useMutation'
import { useNodeDeletion } from '../../hooks'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface NodeFactSheetProps {
  node: GraphNode | null
  edges: GraphEdge[]
  allNodes: GraphNode[]
  onClose: () => void
  isExpanded?: boolean
  onNodeUpdate?: () => void
}

export function NodeFactSheet ({ node, edges, allNodes, onClose, isExpanded, onNodeUpdate }: NodeFactSheetProps) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cascadeDelete, setCascadeDelete] = useState(false)
  const [createRelationshipDialogOpen, setCreateRelationshipDialogOpen] = useState(false)
  const { isSaving, updateNodeProperties, deleteNode } = useMutation()
  
  const nodeId = node?.nodeId || node?.id
  const { outgoingRelationshipsCount, hasOutgoingRelationships } = useNodeDeletion({
    nodeId: deleteDialogOpen ? nodeId : undefined,
    enabled: deleteDialogOpen
  })

  const handleSaveProperty = useCallback(async (property: string, value: unknown) => {
    if (!node?.nodeId && !node?.id) {
      console.error('Node ID is required for updates')
      return
    }

    const nodeId = node.nodeId || node.id
    const success = await updateNodeProperties(nodeId, [{
      property,
      value,
      originalValue: node.properties[property]
    }])

    if (success) {
      setEditingProperty(null)
      onNodeUpdate?.()
    }
  }, [node, updateNodeProperties, onNodeUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingProperty(null)
  }, [])

  const handleStartEdit = useCallback((property: string) => {
    setEditingProperty(property)
  }, [])

  // Calculate connected edges before early return (to use in handleDelete callback)
  const connectedEdges = (() => {
    if (!node) return []
    
    // Deduplicate edges by ID
    const edgeMap = new Map<string, GraphEdge>()
    edges.forEach(edge => {
      if (!edgeMap.has(edge.id)) {
        edgeMap.set(edge.id, edge)
      }
    })
    
    const uniqueEdges = Array.from(edgeMap.values())
    const nodeIdStr = String(node.id)
    
    // Filter edges connected to this node
    return uniqueEdges.filter(edge => {
      const sourceId = typeof edge.source === 'object' && edge.source !== null
        ? String((edge.source as GraphNode).id || (edge.source as GraphNode).nodeId)
        : String(edge.source)
      
      const targetId = typeof edge.target === 'object' && edge.target !== null
        ? String((edge.target as GraphNode).id || (edge.target as GraphNode).nodeId)
        : String(edge.target)
      
      return sourceId === nodeIdStr || targetId === nodeIdStr
    })
  })()


  const handleDelete = useCallback(async () => {
    if (!node?.nodeId && !node?.id) {
      console.error('Node ID is required for deletion')
      return
    }

    const nodeId = node.nodeId || node.id
    const connectedCount = connectedEdges.length
    
    const success = await deleteNode(nodeId, connectedCount > 0, cascadeDelete)
    
    if (success) {
      // Trigger node labels refresh event
      window.dispatchEvent(new CustomEvent('nodeLabelsChanged'))
      setCascadeDelete(false)
      onNodeUpdate?.()
      onClose()
    }
  }, [node, deleteNode, connectedEdges.length, cascadeDelete, onNodeUpdate, onClose])

  if (!node) return null

  // Get connected nodes (for potential future use)
  // const connectedNodes = connectedEdges.map(edge => {
  //   const connectedNodeId = edge.source === node.id ? edge.target : edge.source
  //   return allNodes.find(n => n.id === connectedNodeId)
  // }).filter(Boolean) as GraphNode[]

  const getSpecificLabel = (labels: string[]): string => {
    // Use the last label (usually the most specific one)
    return labels.length > 0 ? labels[labels.length - 1] : 'Node'
  }

  const getFormattedLabel = (labels: string[], properties: Record<string, unknown>): string => {
    const specificLabel = getSpecificLabel(labels)
    // If node has a 'text' property, include it in the label display
    if (properties.text) {
      return `${specificLabel}: "${String(properties.text)}"`
    }
    return specificLabel
  }

  const formattedLabel = getFormattedLabel(node.labels, node.properties)

  // Use database query result for outgoing relationships count from hook
  const outgoingCount = outgoingRelationshipsCount ?? 0

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-sm font-semibold">{formattedLabel}</h3>
          {isExpanded && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Double-click to collapse
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete node"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Labels */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Labels</h4>
            <div className="flex flex-wrap gap-1">
              {node.labels.map(label => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Properties */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Properties</h4>
            </div>
            <div className="space-y-2">
              {Object.entries(node.properties).map(([key, value]) => (
                editingProperty === key ? (
                  <PropertyEditor
                    key={key}
                    property={key}
                    value={value}
                    originalValue={value}
                    onSave={handleSaveProperty}
                    onCancel={handleCancelEdit}
                    isSaving={isSaving}
                  />
                ) : (
                  <div 
                    key={key} 
                    className="text-xs group flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-mono text-muted-foreground">{key}:</span>{' '}
                      <span className="font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(key)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSaving || editingProperty !== null}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              ))}
              {Object.keys(node.properties).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No properties</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Relationships */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Relationships ({connectedEdges.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateRelationshipDialogOpen(true)}
                className="h-6 text-xs px-2"
                title="Create relationship from this node"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {connectedEdges.map(edge => {
                // Extract node IDs from source/target (handle both string and object cases)
                const sourceId = typeof edge.source === 'object' && edge.source !== null
                  ? String((edge.source as GraphNode).id || (edge.source as GraphNode).nodeId)
                  : String(edge.source)
                const targetId = typeof edge.target === 'object' && edge.target !== null
                  ? String((edge.target as GraphNode).id || (edge.target as GraphNode).nodeId)
                  : String(edge.target)
                
                const nodeIdStr = String(node.id)
                const isOutgoing = sourceId === nodeIdStr
                const connectedNodeId = isOutgoing ? targetId : sourceId
                const connectedNode = allNodes.find(n => 
                  String(n.id) === connectedNodeId || String(n.nodeId) === connectedNodeId
                )
                const connectedLabel = connectedNode ? getFormattedLabel(connectedNode.labels, connectedNode.properties) : 'Unknown'
                
                return (
                  <div key={edge.id} className="text-xs p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {isOutgoing ? (
                        <>
                          <Badge variant="outline" className="text-xs">{formattedLabel}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs font-semibold">{edge.type}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs">{connectedLabel}</Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-xs">{connectedLabel}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs font-semibold">{edge.type}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs">{formattedLabel}</Badge>
                        </>
                      )}
                    </div>
                    {Object.keys(edge.properties).length > 0 && (
                      <div className="mt-1 text-muted-foreground">
                        {Object.entries(edge.properties).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {connectedEdges.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No relationships</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Node ID */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Node ID</h4>
            <p className="text-xs font-mono">{node.nodeId || node.id}</p>
          </div>
        </div>
      </ScrollArea>
      
      {deleteDialogOpen && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) {
              setCascadeDelete(false)
            }
          }}
          onConfirm={handleDelete}
          title="Delete Node"
          description={
            <div className="space-y-3">
              <p>
                {connectedEdges.length > 0
                  ? `Are you sure you want to delete this node? It has ${connectedEdges.length} relationship${connectedEdges.length === 1 ? '' : 's'}.`
                  : 'Are you sure you want to delete this node?'}
              </p>
              {hasOutgoingRelationships && (
                <div className="flex items-start space-x-2 p-3 bg-muted rounded-md">
                  <Checkbox
                    id="cascade-delete"
                    checked={cascadeDelete}
                    onCheckedChange={(checked) => setCascadeDelete(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor="cascade-delete"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Cascade delete (delete connected nodes)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      This node contains {outgoingCount} other node{outgoingCount === 1 ? '' : 's'}. If enabled, those nodes will also be deleted. Otherwise, only relationships will be removed and connected nodes will remain.
                    </p>
                  </div>
                </div>
              )}
              {!hasOutgoingRelationships && connectedEdges.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  All relationships connected to this node will be removed (DETACH DELETE). This action cannot be undone.
                </p>
              )}
              {connectedEdges.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              )}
            </div>
          }
          confirmLabel="Delete"
          variant="destructive"
          isLoading={isSaving}
        />
      )}

      {/* Create Relationship Dialog */}
      <CreateRelationshipDialog
        open={createRelationshipDialogOpen}
        onOpenChange={setCreateRelationshipDialogOpen}
        onSuccess={() => {
          onNodeUpdate?.()
        }}
        sourceNodeId={node.nodeId || node.id}
        availableNodes={allNodes}
      />
    </div>
  )
}

