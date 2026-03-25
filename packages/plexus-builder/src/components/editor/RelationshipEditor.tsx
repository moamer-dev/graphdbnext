'use client'

import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useRelationshipEditor } from '../../hooks/editor/useRelationshipEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Pencil, X } from 'lucide-react'
// OntologyCombobox moved to ModelBuilder toolbar
import { SemanticPropertySelect } from '../wizard/XmlImportWizard/components/SemanticPropertySelect'
import type { Relationship, Node } from '../../types'
import { RelationshipRecommendationPanel } from '../ai/RelationshipRecommendationPanel'

interface RelationshipEditorProps {
  className?: string
  onClose?: () => void
}

export function RelationshipEditor({ className, onClose }: RelationshipEditorProps) {
  const {
    relationships,
    nodes,
    relationshipTypes,
    selectedRelationship,
    updateRelationship,
    selectRelationship,
    selectedOntologyId,
    isSemanticEnabled
  } = useModelBuilderStore()

  const relationship = selectedRelationship
    ? relationships.find((r: Relationship) => r.id === selectedRelationship) || null
    : null

  const editor = useRelationshipEditor({ relationship })

  if (!relationship) {
    return (
      <div className={className}>
        <div className="p-4 text-center text-sm text-muted-foreground">
          Select a relationship to edit
        </div>
      </div>
    )
  }

  const fromNode = nodes.find((n: Node) => n.id === editor.from)
  const toNode = nodes.find((n: Node) => n.id === editor.to)

  return (
    <div className={className + ' flex flex-col h-full'}>
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Edit Relationship</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              selectRelationship(null)
              onClose?.()
            }}
            className="h-7 w-7 p-0"
            title="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {fromNode && toNode && (
            <RelationshipRecommendationPanel
              fromNodeId={editor.from}
              toNodeId={editor.to}
              onApply={(suggestion) => {
                if (relationship) {
                  updateRelationship(relationship.id, {
                    type: suggestion.type,
                    cardinality: suggestion.cardinality,
                  })
                  editor.handleTypeInputChange(suggestion.type)
                  if (suggestion.cardinality) {
                    editor.handleCardinalityChange(suggestion.cardinality)
                  }
                }
              }}
            />
          )}

          <div>
            <label className="text-xs font-medium mb-1 block">Type</label>
            <div className="space-y-2">
              {relationshipTypes.length > 0 && (
                <Select
                  value={editor.type}
                  onValueChange={editor.handleTypeChange}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((relType) => (
                      <SelectItem key={relType.type} value={relType.type}>
                        {relType.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={editor.type}
                  onChange={(e) => editor.handleTypeInputChange(e.target.value)}
                  className="flex-1 h-8 text-xs"
                  placeholder="Enter or edit relationship type"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={editor.handleRenameType}
                  disabled={!editor.type.trim() || editor.type.trim() === relationship?.type || editor.typeRenamed}
                  className="h-8 px-3 text-xs"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Rename
                </Button>
              </div>
              {editor.typeRenamed && (
                <p className="text-xs text-muted-foreground">
                  Type renamed successfully.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">From Node</label>
            <Select
              value={editor.from}
              onValueChange={editor.handleFromChange}
              open={editor.fromOpen}
              onOpenChange={editor.setFromOpen}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select source node" />
              </SelectTrigger>
              <SelectContent className="p-0">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search nodes..."
                    value={editor.fromSearch}
                    onChange={(e) => editor.setFromSearch(e.target.value)}
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        editor.setFromOpen(false)
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {nodes
                    .filter((node: Node) => {
                      const searchLower = editor.fromSearch.toLowerCase()
                      return (
                        node.label.toLowerCase().includes(searchLower) ||
                        node.type.toLowerCase().includes(searchLower) ||
                        node.id.toLowerCase().includes(searchLower)
                      )
                    })
                    .map((node: Node) => (
                      <SelectItem key={node.id} value={node.id} className="text-xs">
                        {node.label} ({node.type})
                      </SelectItem>
                    ))}
                  {nodes.filter((node: Node) => {
                    const searchLower = editor.fromSearch.toLowerCase()
                    return (
                      node.label.toLowerCase().includes(searchLower) ||
                      node.type.toLowerCase().includes(searchLower) ||
                      node.id.toLowerCase().includes(searchLower)
                    )
                  }).length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        No nodes found
                      </div>
                    )}
                </div>
              </SelectContent>
            </Select>
            {fromNode && (
              <p className="text-xs text-muted-foreground mt-1">
                {fromNode.label} → {toNode?.label || '...'}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">To Node</label>
            <Select
              value={editor.to}
              onValueChange={editor.handleToChange}
              open={editor.toOpen}
              onOpenChange={editor.setToOpen}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select target node" />
              </SelectTrigger>
              <SelectContent className="p-0">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search nodes..."
                    value={editor.toSearch}
                    onChange={(e) => editor.setToSearch(e.target.value)}
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        editor.setToOpen(false)
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {nodes
                    .filter((node: Node) => {
                      const searchLower = editor.toSearch.toLowerCase()
                      return (
                        node.label.toLowerCase().includes(searchLower) ||
                        node.type.toLowerCase().includes(searchLower) ||
                        node.id.toLowerCase().includes(searchLower)
                      )
                    })
                    .map((node: Node) => (
                      <SelectItem key={node.id} value={node.id} className="text-xs">
                        {node.label} ({node.type})
                      </SelectItem>
                    ))}
                  {nodes.filter((node: Node) => {
                    const searchLower = editor.toSearch.toLowerCase()
                    return (
                      node.label.toLowerCase().includes(searchLower) ||
                      node.type.toLowerCase().includes(searchLower) ||
                      node.id.toLowerCase().includes(searchLower)
                    )
                  }).length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        No nodes found
                      </div>
                    )}
                </div>
              </SelectContent>
            </Select>
            {toNode && (
              <p className="text-xs text-muted-foreground mt-1">
                {fromNode?.label || '...'} → {toNode.label}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Cardinality</label>
            <Select
              value={editor.cardinality || 'none'}
              onValueChange={editor.handleCardinalityChange}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select cardinality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="one-to-one">One-to-One</SelectItem>
                <SelectItem value="one-to-many">One-to-Many</SelectItem>
                <SelectItem value="many-to-many">Many-to-Many</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Semantic Enrichment */}
          {isSemanticEnabled && (
            <div className="border-t pt-4 mt-4">
              <label className="text-xs font-medium mb-2 block">Semantic Enrichment</label>
              <div className="space-y-3">
                {(selectedOntologyId || (relationship.data as any)?.semantic?.ontologyId) ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Property</label>
                    <SemanticPropertySelect
                      ontologyId={selectedOntologyId || (relationship.data as any).semantic?.ontologyId}
                      value={(relationship.data as any)?.semantic?.propertyIri}
                      onValueChange={(iri, propertyData) => {
                        const currentSemantic = (relationship.data as any)?.semantic || {}
                        updateRelationship(relationship.id, {
                          data: {
                            ...relationship.data,
                            semantic: {
                              ...currentSemantic,
                              ontologyId: selectedOntologyId || currentSemantic.ontologyId,
                              propertyIri: iri || undefined,
                              propertyLabel: propertyData?.preferredLabel,
                              propertyCurie: propertyData?.curie
                            }
                          }
                        })
                      }}
                      className="h-8"
                    />
                    {(relationship.data as any)?.semantic?.propertyLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(relationship.data as any).semantic.propertyCurie && (
                          <span className="font-mono text-blue-600">{(relationship.data as any).semantic.propertyCurie}</span>
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Select an ontology in the toolbar to add semantic data.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Update Confirmation Dialog */}
      <Dialog
        open={editor.showBulkUpdateDialog}
        onOpenChange={(open) => {
          if (!open) {
            editor.handleCloseBulkUpdateDialog()
          } else {
            editor.setShowBulkUpdateDialog(open)
          }
        }}
      >
        <DialogContent className="max-w-2xl w-[90vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Update Relationship Type</DialogTitle>
            <DialogDescription>
              There {relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length === 1 ? 'is' : 'are'}{' '}
              {relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length}{' '}
              other relationship{relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length !== 1 ? 's' : ''} with type &quot;{relationship?.type}&quot;.
              How would you like to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={editor.handleCloseBulkUpdateDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => editor.handleBulkUpdate(false)}
              className="w-full sm:w-auto"
            >
              Update This One Only
            </Button>
            <Button
              type="button"
              onClick={() => editor.handleBulkUpdate(true)}
              className="w-full sm:w-auto"
            >
              Update All ({relationships.filter((rel: Relationship) => rel.type === relationship?.type).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

