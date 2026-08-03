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
import { Pencil, X, Fingerprint, Network, ArrowRightLeft } from 'lucide-react'
import { SemanticPropertySelect } from '../wizard/XmlImportWizard/components/SemanticPropertySelect'
import type { Relationship, Node } from '../../types'
import { RelationshipRecommendationPanel } from '../ai/RelationshipRecommendationPanel'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { cn } from '../../utils/cn'

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
    <div className={cn(className, "flex flex-col h-full bg-background/50 backdrop-blur-xl border-l")}>
      {/* Header */}
      <div className="p-4 border-b bg-background/40 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Network className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Edit Relationship</h3>
            {fromNode && toNode && (
              <RelationshipRecommendationPanel
                fromNodeId={editor.from}
                toNodeId={editor.to}
                currentType={editor.type}
                currentCardinality={editor.cardinality}
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
                onRemove={() => {
                  if (relationship) {
                    updateRelationship(relationship.id, {
                      type: '',
                      cardinality: undefined,
                    })
                    editor.handleTypeInputChange('')
                    editor.handleCardinalityChange('none')
                  }
                }}
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              selectRelationship(null)
              onClose?.()
            }}
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* General Configuration */}
          <CollapsibleSection title="General Configuration" defaultOpen={true}>
            <div className="space-y-4 pt-2">
              {/* Relationship Type */}
              <div>
                <label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1.5 block">
                  Relationship Type
                </label>
                <div className="space-y-2">
                  {relationshipTypes.length > 0 && (
                    <Select
                      value={editor.type}
                      onValueChange={editor.handleTypeChange}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                        <SelectValue placeholder="Select type" />
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
                      className="flex-1 h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
                      placeholder="Enter relationship type"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={editor.handleRenameType}
                      disabled={!editor.type.trim() || editor.type.trim() === relationship?.type || editor.typeRenamed}
                      className="h-8 px-3 text-xs border-primary/20 hover:bg-primary/5"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Rename
                    </Button>
                  </div>
                  {editor.typeRenamed && (
                    <p className="text-[10px] text-green-600 font-medium ml-1">
                      Type renamed successfully.
                    </p>
                  )}
                </div>
              </div>

              {/* Inlined Cardinality and Direction (Optional/Future) */}
              <div>
                <label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1.5 block">
                  Cardinality
                </label>
                <Select
                  value={editor.cardinality || 'none'}
                  onValueChange={editor.handleCardinalityChange}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
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

              {/* Connection Grid */}
              <div className="grid grid-cols-1 gap-3 p-3 rounded-md bg-primary/[0.03] border border-primary/10 relative overflow-hidden">
                 {/* Visual Line */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary/10" />
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-primary/40 tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" /> From Node
                  </label>
                  <Select
                    value={editor.from}
                    onValueChange={editor.handleFromChange}
                    open={editor.fromOpen}
                    onOpenChange={editor.setFromOpen}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-background/50 border-primary/20">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="p-0">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search nodes..."
                          value={editor.fromSearch}
                          onChange={(e) => editor.setFromSearch(e.target.value)}
                          className="h-7 text-xs bg-muted/20 border-none focus-visible:ring-0"
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
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-primary/40 tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50" /> To Node
                  </label>
                  <Select
                    value={editor.to}
                    onValueChange={editor.handleToChange}
                    open={editor.toOpen}
                    onOpenChange={editor.setToOpen}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-background/50 border-primary/20">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent className="p-0">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search nodes..."
                          value={editor.toSearch}
                          onChange={(e) => editor.setToSearch(e.target.value)}
                          className="h-7 text-xs bg-muted/20 border-none focus-visible:ring-0"
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
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Semantic Enrichment */}
          {isSemanticEnabled && (
            <CollapsibleSection 
              title="Semantic Enrichment" 
              defaultOpen={!!(relationship.data as any)?.semantic?.propertyIri}
              icon={Fingerprint}
              className="border-t pt-4 mt-4"
            >
              <div className="space-y-4 pt-2">
                {(selectedOntologyId || (relationship.data as any)?.semantic?.ontologyId) ? (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1.5 block text-left">
                      Semantic Property
                    </label>
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
                      className="h-8 bg-primary/5 border-primary/20"
                    />
                    {(relationship.data as any)?.semantic?.propertyLabel && (
                      <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 flex items-center justify-between">
                         <span className="text-[10px] font-medium text-primary/80 truncate max-w-[150px]">
                           {(relationship.data as any).semantic.propertyLabel}
                         </span>
                         {(relationship.data as any).semantic.propertyCurie && (
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-100/80 text-blue-700 border border-blue-200/50">
                             {(relationship.data as any).semantic.propertyCurie}
                           </span>
                         )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-md border border-primary/20 border-dashed bg-primary/5 text-center">
                    <p className="text-[11px] text-primary/60">
                      Select an ontology in the toolbar to enable semantic mapping for this relationship.
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

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
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-100 text-amber-600">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              Update Relationship Type
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              There {relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length === 1 ? 'is' : 'are'}{' '}
              <span className="font-bold text-primary">
                {relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length}
              </span>{' '}
              other relationship{relationships.filter((rel: Relationship) => rel.type === relationship?.type && rel.id !== relationship?.id).length !== 1 ? 's' : ''} with type &quot;<span className="italic">{relationship?.type}</span>&quot;.
              <br/><br/>
              How would you like to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 text-xs">
            <Button
              type="button"
              variant="outline"
              onClick={editor.handleCloseBulkUpdateDialog}
              className="w-full sm:w-auto h-8 text-[11px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => editor.handleBulkUpdate(false)}
              className="w-full sm:w-auto h-8 text-[11px] bg-primary/5 hover:bg-primary/10 border-primary/10"
            >
              Update This Only
            </Button>
            <Button
              type="button"
              onClick={() => editor.handleBulkUpdate(true)}
              className="w-full sm:w-auto h-8 text-[11px]"
            >
              Update All ({relationships.filter((rel: Relationship) => rel.type === relationship?.type).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
