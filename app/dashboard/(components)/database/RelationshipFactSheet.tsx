'use client'

import { useState, useCallback } from 'react'
import { X, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GraphEdge, GraphNode } from '@/lib/services/GraphVisualizationService'
import { PropertyEditor } from './PropertyEditor'
import { useMutation } from '../../hooks/database/useMutation'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface RelationshipFactSheetProps {
  relationship: GraphEdge | null
  sourceNode?: GraphNode | null
  targetNode?: GraphNode | null
  onClose: () => void
  onRelationshipUpdate?: () => void
}

export function RelationshipFactSheet ({ 
  relationship, 
  sourceNode, 
  targetNode, 
  onClose,
  onRelationshipUpdate 
}: RelationshipFactSheetProps) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { isSaving, updateRelationshipProperties, deleteRelationship } = useMutation()

  const handleSaveProperty = useCallback(async (property: string, value: unknown) => {
    if (!relationship) return
    if (!relationship.relationshipId && !relationship.id) {
      console.error('Relationship ID is required for updates')
      return
    }

    // Use relationshipId if available, otherwise try to parse id
    const relId = relationship.relationshipId || parseInt(String(relationship.id))
    if (!relId || isNaN(relId)) {
      console.error('Invalid relationship ID')
      return
    }

    const success = await updateRelationshipProperties(relId, [{
      property,
      value,
      originalValue: relationship.properties[property]
    }])

    if (success) {
      setEditingProperty(null)
      onRelationshipUpdate?.()
    }
  }, [relationship, updateRelationshipProperties, onRelationshipUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingProperty(null)
  }, [])

  const handleStartEdit = useCallback((property: string) => {
    setEditingProperty(property)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!relationship) return
    
    if (!relationship.relationshipId && !relationship.id) {
      console.error('Relationship ID is required for deletion')
      return
    }

    const relId = relationship.relationshipId || parseInt(String(relationship.id))
    if (!relId || isNaN(relId)) {
      console.error('Invalid relationship ID')
      return
    }

    const success = await deleteRelationship(relId)
    
    if (success) {
      onRelationshipUpdate?.()
      onClose()
    }
  }, [relationship, deleteRelationship, onRelationshipUpdate, onClose])

  const getSourceLabel = () => {
    if (!sourceNode) return 'Unknown'
    const specificLabels = sourceNode.labels.filter(label => 
      !['Thing', 'TextUnit', 'VisualUnit'].includes(label)
    )
    return specificLabels.length > 0 ? specificLabels[specificLabels.length - 1] : sourceNode.labels[0] || 'Node'
  }

  const getTargetLabel = () => {
    if (!targetNode) return 'Unknown'
    const specificLabels = targetNode.labels.filter(label => 
      !['Thing', 'TextUnit', 'VisualUnit'].includes(label)
    )
    return specificLabels.length > 0 ? specificLabels[specificLabels.length - 1] : targetNode.labels[0] || 'Node'
  }

  if (!relationship) return null

  return (
    <div className="h-full flex flex-col bg-background border-l shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-sm font-semibold">Relationship</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSourceLabel()} → {relationship.type} → {getTargetLabel()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete relationship"
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
          {/* Relationship Type */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Type</h4>
            <Badge variant="outline" className="text-xs">
              {relationship.type}
            </Badge>
          </div>

          <Separator />

          {/* Properties */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Properties</h4>
            </div>
            <div className="space-y-2">
              {Object.entries(relationship.properties).map(([key, value]) => (
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
              {Object.keys(relationship.properties).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No properties</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Relationship ID */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Relationship ID</h4>
            <p className="text-xs font-mono">{relationship.relationshipId || relationship.id}</p>
          </div>

          {/* Source and Target */}
          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Source Node</h4>
              {sourceNode && (
                <div className="text-xs">
                  <Badge variant="secondary" className="text-xs mr-1">
                    {getSourceLabel()}
                  </Badge>
                  <span className="font-mono text-muted-foreground">ID: {sourceNode.nodeId || sourceNode.id}</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Target Node</h4>
              {targetNode && (
                <div className="text-xs">
                  <Badge variant="secondary" className="text-xs mr-1">
                    {getTargetLabel()}
                  </Badge>
                  <span className="font-mono text-muted-foreground">ID: {targetNode.nodeId || targetNode.id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Relationship"
        description="Are you sure you want to delete this relationship? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSaving}
      />
    </div>
  )
}

