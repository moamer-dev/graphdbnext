'use client'

import { useState } from 'react'
import { Check, X, ArrowRight, ChevronRight, ChevronDown, ChevronsUpDown, ArrowUpDown, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Checkbox } from '../../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../ui/command'
import { cn } from '../../../utils/cn'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../../services/xmlAnalyzer'
import type { Property } from '../../../types'
import { Badge } from '../../ui/badge'
import { AddPropertyPopover } from './AddPropertyPopover'
import { SemanticClassSelect } from '../XmlImportWizard/components/SemanticClassSelect'
import { SemanticPropertySelect } from '../XmlImportWizard/components/SemanticPropertySelect'

export interface SortableMappingItemProps {
  elementType: XmlStructureAnalysis['elementTypes'][number]
  elementMapping: XmlMappingConfig['elementMappings'][string] | undefined
  isIncluded: boolean
  isExpanded: boolean
  isSelected: boolean
  isRemoving?: boolean
  onToggleExpand: () => void
  onSelectToggle: () => void
  onUpdateElementMapping: (elementName: string, updates: Partial<XmlMappingConfig['elementMappings'][string]>) => void
  onUpdateAttributeMapping: (elementName: string, attrName: string, updates: Partial<XmlMappingConfig['attributeMappings'][string][string]>) => void
  onUpdateRelationshipMapping: (relKey: string, updates: Partial<XmlMappingConfig['relationshipMappings'][string]>) => void
  onAddRelationship: (elementName: string, targetName: string) => void
  onRemoveRelationship: (relKey: string) => void
  onReplaceRelationshipKey: (oldKey: string, newKey: string) => void
  onAddCustomProperty: (elementName: string, propertyKey: string) => void
  onRemoveCustomProperty: (elementName: string, propertyKey: string) => void
  onRenameCustomProperty: (elementName: string, oldKey: string, newKey: string) => void
  onRemoveElement: () => void
  mapping: XmlMappingConfig
  relationshipTargets: string[]
  elementIncludeLookup: Map<string, boolean>
  recentlyDroppedId: string | null
  clearRecentlyDropped: () => void
  analysis: XmlStructureAnalysis
  selectedOntologyId?: string | null
}

export function SortableMappingItem({
  elementType,
  elementMapping,
  isIncluded,
  isExpanded,
  isSelected,
  isRemoving = false,
  onToggleExpand,
  onSelectToggle,
  onUpdateElementMapping,
  onUpdateAttributeMapping,
  onUpdateRelationshipMapping,
  onAddRelationship,
  onRemoveRelationship,
  onReplaceRelationshipKey,
  onAddCustomProperty,
  onRemoveCustomProperty,
  onRenameCustomProperty,
  onRemoveElement,
  mapping,
  relationshipTargets,
  elementIncludeLookup,
  recentlyDroppedId,
  clearRecentlyDropped,
  analysis,
  selectedOntologyId
}: SortableMappingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: elementType.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1
  }

  const elementRelationships = Object.entries(mapping.relationshipMappings).filter(([key]) =>
    key.startsWith(`${elementType.name}->`)
  )
  const hasAttributes = elementType.attributes.length > 0
  const hasRelationships = elementRelationships.length > 0
  const isExpandable = isIncluded
  const [relPopoverOpen, setRelPopoverOpen] = useState<Record<string, boolean>>({})

  const dragListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('[data-chevron]') ||
        target.closest('input') ||
        target.closest('button') ||
        target.closest('select')
      ) {
        return
      }
      listeners?.onPointerDown?.(e)
    }
  }

  const handleHeaderMouseUp = (e: React.MouseEvent) => {
    if (isDragging || recentlyDroppedId === elementType.name) {
      clearRecentlyDropped()
      return
    }
    const target = e.target as HTMLElement
    if (
      target.closest('[data-chevron]') ||
      target.closest('input') ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('[role="checkbox"]')
    ) {
      return
    }
    onToggleExpand()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-md"
      {...attributes}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors',
          'cursor-pointer',
          isDragging && 'border-dashed',
          isRemoving && 'opacity-80'
        )}
        onMouseUp={handleHeaderMouseUp}
        {...dragListeners}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectToggle}
            disabled={isRemoving}
            className="h-4 w-4"
            aria-label={`Select ${elementType.name}`}
          />
        </div>
        <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
          <ArrowUpDown className="h-3 w-3" />
        </div>
        {isExpandable ? (
          <div
            data-chevron
            className="h-5 w-5 flex items-center justify-center cursor-pointer hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        ) : (
          <div className="w-5" />
        )}
        <span className="text-sm font-mono font-medium flex-1">{elementType.name}</span>
        {isRemoving && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
            Removing...
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{elementType.count} instances</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onRemoveElement()
          }}
          disabled={isRemoving}
          title="Remove from mapping"
        >
          {isRemoving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      {isExpanded && isIncluded && (
        <div className="px-2 pb-2 space-y-2 border-t bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Node Label</Label>
              <Input
                value={elementMapping?.nodeLabel || ''}
                onChange={(e) => onUpdateElementMapping(elementType.name, { nodeLabel: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Node Type</Label>
              <Input
                value={elementMapping?.nodeType || ''}
                onChange={(e) => onUpdateElementMapping(elementType.name, { nodeType: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Semantic Class Selection - shown when ontology is selected */}
          {selectedOntologyId && (
            <div>
              <Label className="text-xs">Semantic Class (Ontology)</Label>
              <SemanticClassSelect
                ontologyId={selectedOntologyId}
                value={elementMapping?.semantic?.classIri}
                onValueChange={(iri, classData) => {
                  console.log('[SortableMappingItem] Class selected:', { elementType: elementType.name, iri, classLabel: classData?.preferredLabel, selectedOntologyId })
                  onUpdateElementMapping(elementType.name, {
                    semantic: {
                      classIri: iri || undefined,
                      classLabel: classData?.preferredLabel,
                      classCurie: classData?.curie,
                      ontologyId: selectedOntologyId
                    }
                  })
                }}
                className="h-7"
                showSelectedDescription={false}
              />
              {elementMapping?.semantic?.classLabel && (
                <p className="text-xs text-muted-foreground mt-1">
                  Class: <span className="font-medium">{elementMapping.semantic.classLabel}</span>
                  {elementMapping.semantic.classCurie && (
                    <span className="ml-1 text-blue-600">({elementMapping.semantic.classCurie})</span>
                  )}
                </p>
              )}
            </div>
          )}

          {hasAttributes && (
            <div>
              <Label className="text-xs mb-2 block">Attributes → Properties</Label>
              <div className="space-y-2">
                {elementType.attributes.map((attrName) => {
                  const attrMapping = mapping.attributeMappings[elementType.name]?.[attrName]
                  const attrAnalysis = elementType.attributeAnalysis[attrName]

                  if (!attrMapping) return null

                  return (
                    <div key={attrName} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Button
                        variant={attrMapping.include ? 'default' : 'outline'}
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onUpdateAttributeMapping(elementType.name, attrName, { include: !attrMapping.include })}
                      >
                        {attrMapping.include ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </Button>
                      <span className="text-xs font-mono flex-1">{attrName}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {attrMapping.include && (
                        <>
                          <Input
                            value={attrMapping.propertyKey}
                            onChange={(e) => onUpdateAttributeMapping(elementType.name, attrName, { propertyKey: e.target.value })}
                            className="h-6 text-xs w-24"
                            placeholder="key"
                          />
                          <Select
                            value={attrMapping.propertyType}
                            onValueChange={(value: Property['type']) => onUpdateAttributeMapping(elementType.name, attrName, { propertyType: value })}
                          >
                            <SelectTrigger className="h-6 text-xs w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">boolean</SelectItem>
                              <SelectItem value="date">date</SelectItem>
                              <SelectItem value="array">array</SelectItem>
                              <SelectItem value="object">object</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={attrMapping.required ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onUpdateAttributeMapping(elementType.name, attrName, { required: !attrMapping.required })}
                          >
                            {attrMapping.required ? 'Required' : 'Optional'}
                          </Button>
                          {selectedOntologyId && (
                            <SemanticPropertySelect
                              ontologyId={selectedOntologyId}
                              value={attrMapping.semantic?.propertyIri}
                              onValueChange={(iri, propertyData) => {
                                onUpdateAttributeMapping(elementType.name, attrName, {
                                  semantic: {
                                    propertyIri: iri || undefined,
                                    propertyLabel: propertyData?.preferredLabel,
                                    propertyCurie: propertyData?.curie,
                                    ontologyId: selectedOntologyId
                                  }
                                })
                              }}
                              className="h-6 min-w-[10rem] flex-1"
                              showSelectedDescription={false}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Properties</Label>
              <AddPropertyPopover
                elementName={elementType.name}
                onAdd={onAddCustomProperty}
              />
            </div>
            <div className="space-y-2">
              {(() => {
                const allProperties = Object.keys(mapping.attributeMappings[elementType.name] || {})
                const customProperties = allProperties.filter(propKey => {
                  return !elementType.attributes.includes(propKey)
                })

                if (customProperties.length === 0) {
                  return (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                      No custom properties yet. Click + to add one.
                    </div>
                  )
                }

                return customProperties.map((propKey) => {
                  const propMapping = mapping.attributeMappings[elementType.name]?.[propKey]
                  if (!propMapping) return null

                  return (
                    <div key={propKey} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Button
                        variant={propMapping.include ? 'default' : 'outline'}
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onUpdateAttributeMapping(elementType.name, propKey, { include: !propMapping.include })}
                      >
                        {propMapping.include ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </Button>
                      <Input
                        value={propKey}
                        onChange={(e) => {
                          const newKey = e.target.value
                          if (newKey && newKey !== propKey) {
                            onRenameCustomProperty(elementType.name, propKey, newKey)
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            e.target.value = propKey
                          }
                        }}
                        className="h-6 text-xs w-32 font-mono"
                        placeholder="property key"
                      />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {propMapping.include && (
                        <>
                          <Input
                            value={propMapping.propertyKey}
                            onChange={(e) => onUpdateAttributeMapping(elementType.name, propKey, { propertyKey: e.target.value })}
                            className="h-6 text-xs w-24"
                            placeholder="key"
                          />
                          <Select
                            value={propMapping.propertyType}
                            onValueChange={(value: Property['type']) => onUpdateAttributeMapping(elementType.name, propKey, { propertyType: value })}
                          >
                            <SelectTrigger className="h-6 text-xs w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">boolean</SelectItem>
                              <SelectItem value="date">date</SelectItem>
                              <SelectItem value="array">array</SelectItem>
                              <SelectItem value="object">object</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={propMapping.required ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onUpdateAttributeMapping(elementType.name, propKey, { required: !propMapping.required })}
                          >
                            {propMapping.required ? 'Required' : 'Optional'}
                          </Button>
                          {selectedOntologyId && (
                            <SemanticPropertySelect
                              ontologyId={selectedOntologyId}
                              value={propMapping.semantic?.propertyIri}
                              onValueChange={(iri, propertyData) => {
                                onUpdateAttributeMapping(elementType.name, propKey, {
                                  semantic: {
                                    propertyIri: iri || undefined,
                                    propertyLabel: propertyData?.preferredLabel,
                                    propertyCurie: propertyData?.curie,
                                    ontologyId: selectedOntologyId
                                  }
                                })
                              }}
                              className="h-6 min-w-[10rem] flex-1"
                              showSelectedDescription={false}
                            />
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground"
                        onClick={() => onRemoveCustomProperty(elementType.name, propKey)}
                        title="Remove property"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Relationships</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const target = relationshipTargets.find((name) => name !== elementType.name)
                  if (target) onAddRelationship(elementType.name, target)
                }}
                disabled={relationshipTargets.length <= 1}
                title="Add relationship"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {elementRelationships.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                No relationships yet. Click + to add one.
              </div>
            ) : (
              <div className="space-y-1">
                {elementRelationships.map(([relKey, relMapping]) => {
                  const targetName = relKey.slice(relKey.indexOf('->') + 2) || ''
                  const targetIncluded = elementIncludeLookup.get(targetName)
                  const isOpen = relPopoverOpen[relKey] || false
                  const candidateTargets = relationshipTargets.filter((name: string) => name !== elementType.name)
                  return (
                    <div key={relKey} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Button
                        variant={relMapping.include && targetIncluded ? 'default' : 'outline'}
                        size="sm"
                        className="h-5 w-5 p-0"
                        disabled={!targetIncluded}
                        onClick={() => onUpdateRelationshipMapping(relKey, { include: !relMapping.include })}
                      >
                        {relMapping.include ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </Button>
                      <span className="text-xs font-mono">{elementType.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Input
                        value={relMapping.relationshipType}
                        onChange={(e) => onUpdateRelationshipMapping(relKey, { relationshipType: e.target.value })}
                        className="h-6 text-xs w-28"
                        disabled={!relMapping.include || !targetIncluded}
                      />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Popover
                        open={isOpen}
                        onOpenChange={(open: boolean) => setRelPopoverOpen(prev => ({ ...prev, [relKey]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs w-40 justify-between"
                            disabled={!relMapping.include || !targetIncluded}
                          >
                            <span className="truncate">{targetName || 'Select node'}</span>
                            <ChevronsUpDown className="h-3 w-3 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-48">
                          <Command>
                            <CommandInput placeholder="Search nodes..." className="h-8 text-xs" />
                            <CommandList>
                              <CommandEmpty>No results found.</CommandEmpty>
                              <CommandGroup>
                                {candidateTargets.map((name: string) => (
                                  <CommandItem
                                    key={name}
                                    value={name}
                                    onSelect={(value: string) => {
                                      const newKey = `${elementType.name}->${value}`
                                      onReplaceRelationshipKey(relKey, newKey)
                                      setRelPopoverOpen(prev => ({ ...prev, [relKey]: false }))
                                    }}
                                  >
                                    {name}
                                    {targetName === name ? <Check className="h-3 w-3 ml-auto" /> : null}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {/* Semantic Property Selection */}
                      {selectedOntologyId && relMapping.include && targetIncluded && (
                        <SemanticPropertySelect
                          ontologyId={selectedOntologyId}
                          value={relMapping.semantic?.propertyIri}
                          onValueChange={(iri, propData) => {
                            onUpdateRelationshipMapping(relKey, {
                              semantic: {
                                propertyIri: iri || undefined,
                                propertyLabel: propData?.preferredLabel,
                                propertyCurie: propData?.curie,
                                ontologyId: selectedOntologyId
                              }
                            })
                          }}
                          className="h-6 min-w-[7rem] flex-1"
                          showSelectedDescription={false}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground"
                        onClick={() => onRemoveRelationship(relKey)}
                        title="Remove relationship"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

