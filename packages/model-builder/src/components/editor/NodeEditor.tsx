'use client'

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
import { Eye, EyeOff, Crosshair, X } from 'lucide-react'
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

  if (node) {
    console.log('[NodeEditor] Selected node:', { nodeId: node.id, nodeType: node.type, hasData: !!node.data, data: node.data, semantic: (node.data as any)?.semantic })
  }

  const editor = useNodeEditor({ node })

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
          <NodePropertySuggestionPanel
            node={node}
            onApply={(propertiesToAdd) => {
              // Merge with existing properties, avoiding duplicates
              const existingKeys = new Set(editor.properties.map(p => p.key.toLowerCase()))
              const newProperties = propertiesToAdd.filter(p => !existingKeys.has(p.key.toLowerCase()))

              // Batch update all new properties at once
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
              }
            }}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Properties</label>
              <button
                onClick={editor.handleAddProperty}
                className="text-xs text-primary hover:underline"
              >
                + Add
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {editor.properties.map((prop, index) => (
                <div key={index} className="space-y-2 p-2 border rounded">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={prop.key}
                      onChange={(e) => editor.handleUpdateProperty(index, { key: e.target.value })}
                      placeholder="Property name"
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    />
                    <button
                      onClick={() => editor.handleDeleteProperty(index)}
                      className="text-red-500 hover:text-red-700 text-xs shrink-0"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={prop.type}
                      onChange={(e) => editor.handleUpdateProperty(index, { type: e.target.value as Property['type'] })}
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={prop.required}
                        onChange={(e) => editor.handleUpdateProperty(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                  {/* Property-level semantic annotation */}
                  {isSemanticEnabled && (selectedOntologyId || (node.data as any)?.semantic?.ontologyId) && prop.key && (
                    <div className="pt-2 border-t">
                      <label className="text-xs text-muted-foreground mb-1 block">Semantic Property</label>
                      <SemanticPropertySelect
                        ontologyId={selectedOntologyId || (node.data as any).semantic.ontologyId}
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
                                  ontologyId: (node.data as any).semantic.ontologyId
                                } : undefined
                              }
                            }
                          })
                        }}
                        className="h-7"
                      />
                      {(node.data as any)?.propertySemantics?.[prop.key]?.propertyCurie && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-mono text-blue-600">
                            {(node.data as any).propertySemantics[prop.key].propertyCurie}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {editor.properties.length === 0 && (
                <p className="text-xs text-muted-foreground">No properties defined</p>
              )}
            </div>
          </div>



          {/* XML Element Details - Show if node was imported from XML */}
          {xmlElementDetails}
        </div>
      </div>
    </div>
  )
}

