'use client'

import { useRelationshipPaletteDialogs } from '../../../hooks/palette/useRelationshipPaletteDialogs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { Plus, FileText, ArrowRight, X, Upload, Download } from 'lucide-react'
import { useModelBuilderStore } from '../../../stores/modelBuilderStore'
import { generateRelationshipTemplate } from '../../../services/parseService'
import { downloadFile } from '../../../utils/exportUtils'
import { ConfirmDialog } from '../../dialogs/ConfirmDialog'
import type { Node, Relationship } from '../../../types'

interface RelationshipsPaletteSectionProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  onFocusRelationship?: (fromNodeId: string, toNodeId: string) => void
}

export function RelationshipsPaletteSection({
  scrollContainerRef,
  onFocusRelationship
}: RelationshipsPaletteSectionProps) {
  const nodes = useModelBuilderStore((state) => state.nodes)
  const relationships = useModelBuilderStore((state) => state.relationships)
  const relationshipTypes = useModelBuilderStore((state) => state.relationshipTypes)
  const selectedRelationship = useModelBuilderStore((state) => state.selectedRelationship)
  const selectRelationship = useModelBuilderStore((state) => state.selectRelationship)

  const dialogs = useRelationshipPaletteDialogs()
  const {
    relationshipDialogOpen,
    setRelationshipDialogOpen,
    bulkRelationshipDialogOpen,
    setBulkRelationshipDialogOpen,
    deleteRelationshipDialogOpen,
    setDeleteRelationshipDialogOpen,
    relationshipFrom,
    setRelationshipFrom,
    relationshipTo,
    setRelationshipTo,
    relationshipType,
    setRelationshipType,
    bulkRelationshipInput,
    setBulkRelationshipInput,
    bulkRelationshipFile,
    setBulkRelationshipFile,
    pendingRelationshipId,
    bulkRelationshipFileInputRef,
    handleAddRelationship,
    handleBulkRelationshipAdd,
    handleBulkRelationshipFileSelect,
    handleDeleteRelationship,
    handleConfirmDeleteRelationship
  } = dialogs

  const handleDownloadRelationshipTemplate = () => {
    const csvContent = generateRelationshipTemplate()
    downloadFile(csvContent, 'relationship-template.csv', 'text/csv;charset=utf-8;')
  }

  return (
    <>
      {/* Add Relationship and Bulk Add Buttons */}
      <div className="flex gap-2 p-2">
        <Dialog open={relationshipDialogOpen} onOpenChange={setRelationshipDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border border-dashed border-border/60 shadow-sm hover:shadow text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
              Add Relationship
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Relationship</DialogTitle>
              <DialogDescription>
                Create a relationship between two nodes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rel-from">From Node</Label>
                <Select value={relationshipFrom} onValueChange={setRelationshipFrom}>
                  <SelectTrigger id="rel-from">
                    <SelectValue placeholder="Select source node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label} ({node.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rel-type">Relationship Type</Label>
                <Input
                  id="rel-type"
                  placeholder="e.g., HAS, BELONGS_TO, CONTAINS"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rel-to">To Node</Label>
                <Select value={relationshipTo} onValueChange={setRelationshipTo}>
                  <SelectTrigger id="rel-to">
                    <SelectValue placeholder="Select target node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label} ({node.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRelationshipDialogOpen(false)
                  setRelationshipFrom('')
                  setRelationshipTo('')
                  setRelationshipType('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddRelationship}
                disabled={!relationshipFrom || !relationshipTo || !relationshipType.trim()}
              >
                Add Relationship
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <button
          onClick={() => setBulkRelationshipDialogOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border border-dashed border-border/60 shadow-sm hover:shadow text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-3.5 w-3.5" />
          Bulk Add
        </button>
      </div>

      {/* Relationships List */}
      <div className="p-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/40">
          Relationships ({relationships.length})
          {relationshipTypes.length > 0 && (
            <span className="ml-2 text-muted-foreground/70">
              • {relationshipTypes.length} unique type{relationshipTypes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div ref={scrollContainerRef} className="mt-2 space-y-2">
          {relationships.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No relationships yet. Create relationships by connecting nodes on the canvas.
            </div>
          ) : relationshipTypes.length > 0 ? (
            // Group relationships by type
            relationshipTypes.map((relType) => {
              const typeRelationships = relationships.filter((rel: Relationship) => rel.type === relType.type)
              if (typeRelationships.length === 0) return null

              return (
                <div key={relType.type} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {relType.type} ({typeRelationships.length})
                  </div>
                  {typeRelationships.map((rel: Relationship) => {
                    const fromNode = nodes.find((n: Node) => n.id === rel.from)
                    const toNode = nodes.find((n: Node) => n.id === rel.to)
                    const isSelected = selectedRelationship === rel.id

                    const handleMouseDown = (e: React.MouseEvent) => {
                      if (!(e.target as HTMLElement).closest('button')) {
                        selectRelationship(rel.id)
                      }
                    }

                    const handleClick = (e: React.MouseEvent) => {
                      if (!(e.target as HTMLElement).closest('button')) {
                        selectRelationship(rel.id)
                        onFocusRelationship?.(rel.from, rel.to)
                      }
                    }

                    return (
                      <div
                        key={rel.id}
                        data-relationship-id={rel.id}
                        onMouseDown={handleMouseDown}
                        onClick={handleClick}
                        className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all cursor-pointer ml-2 ${isSelected
                            ? 'bg-primary/10 border border-primary shadow-md'
                            : 'bg-muted/40 border border-border/60 shadow-sm hover:bg-muted/60 hover:shadow'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate text-foreground">
                              {fromNode?.label || 'Unknown'}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate text-foreground">
                              {toNode?.label || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleDeleteRelationship(rel.id)
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded p-1 z-10 relative"
                          title="Delete relationship"
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            // Fallback: show all relationships if no types are defined
            relationships.map((rel: Relationship) => {
              const fromNode = nodes.find((n: Node) => n.id === rel.from)
              const toNode = nodes.find((n: Node) => n.id === rel.to)
              const isSelected = selectedRelationship === rel.id

              const handleMouseDown = (e: React.MouseEvent) => {
                if (!(e.target as HTMLElement).closest('button')) {
                  selectRelationship(rel.id)
                }
              }

              const handleClick = (e: React.MouseEvent) => {
                if (!(e.target as HTMLElement).closest('button')) {
                  selectRelationship(rel.id)
                  onFocusRelationship?.(rel.from, rel.to)
                }
              }

              return (
                <div
                  key={rel.id}
                  data-relationship-id={rel.id}
                  onMouseDown={handleMouseDown}
                  onClick={handleClick}
                  className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all cursor-pointer ${isSelected
                      ? 'bg-primary/10 border border-primary shadow-md'
                      : 'bg-muted/40 border border-border/60 shadow-sm hover:bg-muted/60 hover:shadow'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate text-foreground">
                        {fromNode?.label || 'Unknown'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate text-foreground">
                        {toNode?.label || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate text-[10px] mt-0.5">
                      {rel.type}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      handleDeleteRelationship(rel.id)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded p-1 z-10 relative"
                    title="Delete relationship"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Bulk Add Relationships Dialog */}
      <Dialog open={bulkRelationshipDialogOpen} onOpenChange={setBulkRelationshipDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bulk Add Relationships</DialogTitle>
            <DialogDescription>
              Add multiple relationships at once. Use CSV format: from,to,type
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
              <li>CSV format: <code className="bg-muted px-1 rounded">from,to,type</code> or <code className="bg-muted px-1 rounded">from:to:type</code></li>
              <li>Use node labels or IDs for from/to fields</li>
              <li>Example: <code className="bg-muted px-1 rounded">Person,Company,WORKS_AT</code></li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-relationship-file">Import from CSV/TXT file (optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadRelationshipTemplate}
                    className="text-xs h-7"
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Download Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkRelationshipFileInputRef.current?.click()}
                    className="text-xs h-7"
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Choose File
                  </Button>
                </div>
              </div>
              <Input
                id="bulk-relationship-file"
                ref={bulkRelationshipFileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleBulkRelationshipFileSelect}
                className="hidden"
              />
              {bulkRelationshipFile && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {bulkRelationshipFile.name}
                  <button
                    onClick={() => {
                      setBulkRelationshipFile(null)
                      setBulkRelationshipInput('')
                      if (bulkRelationshipFileInputRef.current) {
                        bulkRelationshipFileInputRef.current.value = ''
                      }
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-relationship-input">Or enter relationships manually (one per line)</Label>
              <textarea
                id="bulk-relationship-input"
                value={bulkRelationshipInput}
                onChange={(e) => setBulkRelationshipInput(e.target.value)}
                placeholder="Person,Company,WORKS_AT&#10;Company,Product,PRODUCES&#10;Person,Product,BUYS"
                className="w-full min-h-[120px] px-3 py-2 text-xs border border-input bg-background rounded-md resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkRelationshipDialogOpen(false)
                setBulkRelationshipInput('')
                setBulkRelationshipFile(null)
                if (bulkRelationshipFileInputRef.current) {
                  bulkRelationshipFileInputRef.current.value = ''
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRelationshipAdd}
              disabled={!bulkRelationshipInput.trim() && !bulkRelationshipFile}
            >
              Add Relationships
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Relationship Confirmation Dialog */}
      <ConfirmDialog
        open={deleteRelationshipDialogOpen}
        onOpenChange={setDeleteRelationshipDialogOpen}
        title="Delete Relationship"
        description={
          pendingRelationshipId
            ? (() => {
              const rel = relationships.find((r) => r.id === pendingRelationshipId)
              return rel
                ? `Are you sure you want to delete the relationship "${rel.type || 'RELATES_TO'}"? This action cannot be undone.`
                : 'Are you sure you want to delete this relationship?'
            })()
            : 'Are you sure you want to delete this relationship?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteRelationship}
        variant="destructive"
      />
    </>
  )
}

