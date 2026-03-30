'use client'

import { useState } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useNodeEditor } from '../../hooks/editor/useNodeEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../../utils/cn'
import { Eye, EyeOff, Crosshair, X, ChevronDown, ChevronRight, Hash, Trash2, AlertCircle } from 'lucide-react'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { NodePropertySuggestionPanel } from '../ai/NodePropertySuggestionPanel'
// OntologyCombobox moved to ModelBuilder toolbar
import { SemanticClassSelect } from '../wizard/XmlImportWizard/components/SemanticClassSelect'
import { SemanticPropertySelect } from '../wizard/XmlImportWizard/components/SemanticPropertySelect'
import type { Node, Property } from '../../types'

interface NodeEditorProps {
  className?: string
  onFocusNode?: (id: string) => void
  onClose?: () => void
}

export function NodeEditor({ className, onFocusNode, onClose }: NodeEditorProps) {
  const {
    nodes,
    groups,
    selectedNode,
    selectNode,
    hideUnconnectedNodes,
    setHideUnconnectedNodes,
    rootNodeId,
    setRootNodeId,
    updateNode,
    selectedOntologyId,
    isSemanticEnabled
  } = useModelBuilderStore()

  const node = selectedNode ? nodes.find((n: Node) => n.id === selectedNode) || null : null

  const editor = useNodeEditor({ node })
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set([0]))
 
  const toggleExpand = (index: number) => {
    const next = new Set(expandedIndices)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setExpandedIndices(next)
  }

  if (!node) {
    return (
      <div className={className}>
        <div className="p-4 text-center text-sm text-muted-foreground">
          Select a node to edit
        </div>
      </div>
    )
  }


  // Extract XML element details for display
  const xmlElementDetails = (() => {
    if (!node.data || !(node.data as Record<string, unknown>).sourceElement) {
      return null
    }

    const xmlData = node.data as Record<string, unknown>
    const typeStats = xmlData.xmlTypeStatistics as { count: number; attributesCount: number; childrenCount: number; hasTextContent: boolean } | undefined
    const xmlChildren = xmlData.xmlChildren as Array<{ name: string; count: number }> | undefined
    const xmlParent = xmlData.xmlParent as string | undefined
    const xmlAncestors = xmlData.xmlAncestors as string[] | undefined

    if (!typeStats && !xmlChildren && !xmlParent && !xmlAncestors) return null

    return (
      <div className="border-t pt-4 mt-4">
        <CollapsibleSection title="XML Element Details" defaultOpen={false}>
          <div className="space-y-4">
            {/* Type Statistics */}
            {typeStats && (
              <div>
                <h5 className="text-xs font-medium mb-2">Type Statistics</h5>
                <div className="bg-muted/50 p-2 rounded space-y-1">
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Total Instances:</span>
                    <span className="font-mono font-medium">{typeStats.count}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Attributes:</span>
                    <span className="font-mono font-medium">{typeStats.attributesCount}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Child Types:</span>
                    <span className="font-mono font-medium">{typeStats.childrenCount}</span>
                  </div>
                  {typeStats.hasTextContent && (
                    <div className="text-xs text-muted-foreground italic">
                      Contains text content
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Children */}
            {xmlChildren && xmlChildren.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Children ({xmlChildren.length} types)</h5>
                <div className="flex flex-wrap gap-2">
                  {xmlChildren.map((child, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-muted/50 rounded border">
                      <code className="font-mono">{child.name}</code>
                      {child.count > 0 && (
                        <span className="ml-1 text-muted-foreground">({child.count})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parent Element */}
            {xmlParent && (
              <div>
                <h5 className="text-xs font-medium mb-2">Parent Element</h5>
                <div className="bg-muted/50 p-2 rounded">
                  <code className="text-xs font-mono">{xmlParent}</code>
                </div>
              </div>
            )}

            {/* Ancestors */}
            {xmlAncestors && xmlAncestors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Ancestors ({xmlAncestors.length})</h5>
                <div className="flex flex-wrap gap-2">
                  {xmlAncestors.map((ancestor, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-muted/30 rounded border">
                      <code className="font-mono">{ancestor}</code>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    )
  })()

  return (
    <div className={className}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Edit Node</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onFocusNode?.(node.id)}
              className="h-7 px-2 text-xs"
              title="Focus node on canvas"
            >
              <Crosshair className="h-3 w-3 mr-1" />
              Focus
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHideUnconnectedNodes(!hideUnconnectedNodes)}
              className="h-7 px-2 text-xs"
              title={hideUnconnectedNodes ? 'Show all nodes' : 'Hide unconnected nodes'}
            >
              {hideUnconnectedNodes ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Show All
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Hide Others
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                selectNode(null)
                onClose?.()
              }}
              className="h-7 w-7 p-0"
              title="Close editor"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-[calc(100%-4rem)]">
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-medium mb-1 block">Label</label>
            <input
              type="text"
              value={editor.label}
              onChange={(e) => editor.setLabel(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="Node label"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Type</label>
            <input
              type="text"
              value={editor.type}
              onChange={(e) => editor.setType(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="Node type"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Group</label>
            <Select
              value={editor.groupId || 'none'}
              onValueChange={editor.handleGroupChange}
            >
              <SelectTrigger className="w-full h-8 text-xs">
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
          <div>
            <label className="text-xs font-medium mb-1 block">Root Node</label>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={node ? rootNodeId === node.id : false}
                onCheckedChange={(checked) => {
                  if (node) {
                    if (checked) {
                      // Set this node as root (will automatically unset previous root)
                      setRootNodeId(node.id)
                    } else {
                      // Unset root
                      setRootNodeId(null)
                    }
                  }
                }}
                disabled={!node}
              />
              <label className="text-xs text-muted-foreground">
                Set as root node for workflow execution
              </label>
            </div>
            {rootNodeId && rootNodeId !== node?.id && (
              <p className="text-xs text-muted-foreground mt-1">
                Current root: {nodes.find(n => n.id === rootNodeId)?.label || 'Unknown'}
              </p>
            )}
          </div>
          {/* Semantic Enrichment */}
          {isSemanticEnabled && (
            <div className="border-t pt-4 mt-4">
              <label className="text-xs font-medium mb-2 block">Semantic Enrichment</label>
              <div className="space-y-3">
                {(selectedOntologyId || (node.data as any)?.semantic?.ontologyId) ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Class</label>
                    <SemanticClassSelect
                      ontologyId={selectedOntologyId || (node.data as any).semantic?.ontologyId}
                      value={(node.data as any)?.semantic?.classIri}
                      onValueChange={(iri, classData) => {
                        const currentSemantic = (node.data as any)?.semantic || {}
                        updateNode(node.id, {
                          data: {
                            ...node.data,
                            semantic: {
                              ...currentSemantic,
                              ontologyId: selectedOntologyId || currentSemantic.ontologyId,
                              classIri: iri || undefined,
                              classLabel: classData?.preferredLabel,
                              classCurie: classData?.curie
                            }
                          }
                        })
                      }}
                      className="h-8"
                    />
                    {(node.data as any)?.semantic?.classLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(node.data as any).semantic.classCurie && (
                          <span className="font-mono text-blue-600">{(node.data as any).semantic.classCurie}</span>
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
            <CollapsibleSection
              title="Properties"
              defaultOpen={true}
              icon={Hash}
              className="border-t pt-4 mt-4"
              headerClassName="mb-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-muted/50 mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Configured Fields</span>
                  <div className="flex items-center gap-2">
                    <NodePropertySuggestionPanel
                      node={node}
                      onApply={(p) => {
                        const existingKeys = new Set(editor.properties.map(p => p.key.toLowerCase()))
                        const newProperties = p.filter(p => !existingKeys.has(p.key.toLowerCase()))
                        if (newProperties.length > 0) {
                          const updatedProperties = [
                            ...editor.properties,
                            ...newProperties.map(p => ({
                              key: p.key,
                              type: p.type,
                              required: p.required ?? false,
                              description: p.description,
                            }))
                          ]
                          editor.setProperties(updatedProperties)
                          // Expand newly added properties
                          const newIndices = new Set(expandedIndices)
                          for (let i = editor.properties.length; i < updatedProperties.length; i++) {
                            newIndices.add(i)
                          }
                          setExpandedIndices(newIndices)
                        }
                      }}
                      onRemove={(keys) => {
                        const keysArray = Array.isArray(keys) ? keys.map(k => k.toLowerCase()) : [keys.toLowerCase()];
                        const updatedProperties = editor.properties.filter(p => !keysArray.includes(p.key.toLowerCase()))
                        editor.setProperties(updatedProperties)
                      }}
                    />
                    <button
                      onClick={() => {
                        editor.handleAddProperty()
                        setExpandedIndices(prev => new Set([...prev, editor.properties.length]))
                      }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      + Add
                    </button>
                  </div>
                </div>
 
                <div className="space-y-2">
                  {editor.properties.map((prop, index) => {
                    const isExpanded = expandedIndices.has(index)
                    const semanticMapping = (node.data as any)?.propertySemantics?.[prop.key]
                    const hasSemantic = !!semanticMapping?.propertyIri
                    const showSemanticWarning = isSemanticEnabled && (selectedOntologyId || (node.data as any)?.semantic?.ontologyId) && !hasSemantic

                    return (
                      <div key={index} className={cn(
                        "rounded-lg border bg-muted/5 transition-all overflow-hidden",
                        isExpanded ? "border-primary/20 bg-primary/5 shadow-sm" : "hover:bg-muted/10 border-transparent",
                        showSemanticWarning && !isExpanded && "border-amber-500/30 bg-amber-500/5"
                      )}>
                        {/* Property Header */}
                        <div
                          className="flex items-center gap-2 cursor-pointer group py-2 px-2"
                          onClick={() => toggleExpand(index)}
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn(
                                "text-xs font-medium truncate",
                                !prop.key && "text-muted-foreground italic"
                              )}>
                                {prop.key || "Unnamed property"}
                              </span>
                              {showSemanticWarning && !isExpanded && (
                                <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 animate-pulse" />
                              )}
                              {hasSemantic && !isExpanded && (
                                <span className={cn(
                                  "text-[9px] font-mono px-1 py-0 rounded",
                                  isExpanded ? "bg-primary/20 text-primary" : "bg-blue-100 text-blue-700"
                                )}>
                                  {semanticMapping?.propertyCurie || "Mapped"}
                                </span>
                              )}
                            </div>
                            {!isExpanded && (
                              <span className="text-[10px] bg-muted border rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                                {prop.type}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              editor.handleDeleteProperty(index)
                            }}
                            className="text-muted-foreground hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
 
                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="p-3 space-y-3 pt-0 border-t border-primary/10">
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Field Name</label>
                              <input
                                type="text"
                                value={prop.key}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => editor.handleUpdateProperty(index, { key: e.target.value })}
                                placeholder="e.g. email, age, full_name"
                                className="w-full px-2 py-1.5 text-xs bg-background border rounded focus-visible:ring-1 focus-visible:ring-primary outline-none transition-shadow"
                              />
                            </div>
 
                            <div className="flex gap-3 items-end">
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Data Type</label>
                                <Select
                                  value={prop.type}
                                  onValueChange={(val) => editor.handleUpdateProperty(index, { type: val as Property['type'] })}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-background focus:bg-background transition-colors w-full">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="string" className="text-xs">String</SelectItem>
                                    <SelectItem value="number" className="text-xs">Number</SelectItem>
                                    <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
                                    <SelectItem value="date" className="text-xs">Date</SelectItem>
                                    <SelectItem value="array" className="text-xs">Array</SelectItem>
                                    <SelectItem value="object" className="text-xs">Object</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
 
                              <label className="flex items-center gap-1.5 text-xs h-8 pb-0.5 cursor-pointer">
                                <Checkbox
                                  checked={prop.required}
                                  onCheckedChange={(checked) => editor.handleUpdateProperty(index, { required: checked === true })}
                                />
                                <span className="font-medium text-muted-foreground">Required</span>
                              </label>
                            </div>
 
                            {/* Property-level semantic annotation */}
                            {isSemanticEnabled && (selectedOntologyId || (node.data as any)?.semantic?.ontologyId) && prop.key && (
                              <div className="pt-2 border-t border-primary/10 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Semantic Mapping</label>
                                </div>
                                <SemanticPropertySelect
                                  ontologyId={selectedOntologyId || (node.data as any)?.semantic?.ontologyId}
                                  value={(node.data as any)?.propertySemantics?.[prop.key]?.propertyIri}
                                  onValueChange={(iri, propertyData) => {
                                    const currentPropertySemantics = (node.data as any)?.propertySemantics || {}
                                    updateNode(node.id, {
                                      data: {
                                        ...node.data,
                                        propertySemantics: {
                                          ...currentPropertySemantics,
                                          [prop.key]: iri ? {
                                            propertyIri: iri,
                                            propertyLabel: propertyData?.preferredLabel,
                                            propertyCurie: propertyData?.curie,
                                            ontologyId: (node.data as any)?.semantic?.ontologyId
                                          } : undefined
                                        }
                                      }
                                    })
                                  }}
                                  className="h-8"
                                />
                                {(node.data as any)?.propertySemantics?.[prop.key]?.propertyCurie && (
                                  <p className="text-[10px] flex items-center gap-1">
                                    <span className="text-muted-foreground">Curie:</span>
                                    <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">
                                      {(node.data as any).propertySemantics[prop.key].propertyCurie}
                                    </span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
 
                {editor.properties.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/5">
                    <p className="text-xs text-muted-foreground font-medium">No properties defined yet</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Add them manually or use AI suggestions</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>



          {/* XML Element Details - Show if node was imported from XML */}
          {xmlElementDetails}
        </div>
      </div>
    </div>
  )
}

