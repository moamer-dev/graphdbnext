'use client'

import { useEffect, useMemo } from 'react'
import { useXmlMappingState } from '../../hooks/wizard/useXmlMappingState'
import { Check, X, Settings, ArrowRight, ChevronRight, ChevronDown, ChevronsDownUp, ChevronsUpDown, Plus, Trash2, Search, CheckSquare, Square, Loader2 } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { cn } from '../../utils/cn'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../services/xmlAnalyzer'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { SortableMappingItem } from './XmlMappingConfigurator/SortableMappingItem'

interface XmlMappingConfiguratorProps {
  analysis: XmlStructureAnalysis
  initialMapping?: XmlMappingConfig
  onMappingChange: (mapping: XmlMappingConfig) => void
  className?: string
  onRemoveElements?: (elementNames: string[]) => void
  addingItems?: Set<string>
  removingItems?: Set<string>
  selectedOntologyId?: string | null
}

export function XmlMappingConfigurator({
  analysis,
  initialMapping,
  onMappingChange,
  onRemoveElements,
  addingItems = new Set(),
  removingItems = new Set(),
  className,
  selectedOntologyId
}: XmlMappingConfiguratorProps) {
  const rootElementName = useXmlImportWizardStore((state) => state.rootElementName)
  const setRootElementName = useXmlImportWizardStore((state) => state.setRootElementName)

  const mappingState = useXmlMappingState({
    analysis,
    initialMapping,
    onMappingChange
  })

  const {
    mapping,
    expandedElements,
    orderedElements,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedItems,
    setSelectedItems,
    recentlyDroppedId,
    setRecentlyDroppedId,
    elementIncludeLookup,
    updateElementMapping,
    addCustomProperty,
    removeCustomProperty,
    renameCustomProperty,
    updateAttributeMapping,
    updateRelationshipMapping,
    addRelationshipMapping,
    removeRelationshipMapping,
    replaceRelationshipKey,
    toggleExpand,
    expandAll,
    collapseAll,
    handleSelectItem,
    setOrderedElements,
    setExpandedElements
  } = mappingState

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedItems(new Set(visibleElements.map(et => et.name)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleRemoveElements = async (elementNames: string[]) => {
    if (elementNames.length === 0) return
    if (onRemoveElements) {
      await onRemoveElements(elementNames)
      setSelectedItems(prev => {
        const next = new Set(prev)
        elementNames.forEach(name => next.delete(name))
        return next
      })
      return
    }
    const newMapping: XmlMappingConfig = {
      ...mapping,
      elementMappings: { ...mapping.elementMappings },
      attributeMappings: { ...mapping.attributeMappings },
      relationshipMappings: { ...mapping.relationshipMappings }
    }
    elementNames.forEach((name) => {
      delete newMapping.elementMappings[name]
      delete newMapping.attributeMappings[name]
      Object.keys(newMapping.relationshipMappings).forEach((relKey) => {
        if (relKey.startsWith(`${name}->`) || relKey.includes(`->${name}`)) {
          delete newMapping.relationshipMappings[relKey]
        }
      })
    })
    updateElementMapping('', {}) // Trigger mapping update via hook
    // Directly call onMappingChange since we need to update the mapping
    onMappingChange(newMapping)
    setSelectedItems(prev => {
      const next = new Set(prev)
      elementNames.forEach(name => next.delete(name))
      return next
    })
  }

  // Visible elements: only those included in mapping
  const visibleElements = useMemo(() => {
    const includedNames = Object.entries(mapping.elementMappings)
      .filter(([_, config]) => config.include)
      .map(([name]) => name)
    const elementMap = new Map(analysis.elementTypes.map(et => [et.name, et]))
    const orderedIncluded = orderedElements.filter(name => includedNames.includes(name))
    const remaining = includedNames.filter(name => !orderedElements.includes(name))
    const baseList = [...orderedIncluded, ...remaining]
      .map(name => elementMap.get(name))
      .filter(Boolean) as XmlStructureAnalysis['elementTypes'][number][]

    const filtered = (() => {
      if (!searchQuery.trim()) return baseList
      const query = searchQuery.toLowerCase().trim()
      return baseList.filter(et => {
        const mappingEntry = mapping.elementMappings[et.name]
        const label = mappingEntry?.nodeLabel || et.name
        const type = mappingEntry?.nodeType || et.name
        return (
          et.name.toLowerCase().includes(query) ||
          label.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query)
        )
      })
    })()

    if (sortBy === 'none') {
      return filtered
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'count-asc':
          return a.count - b.count
        case 'count-desc':
          return b.count - a.count
        default:
          return 0
      }
    })

    return sorted
  }, [analysis.elementTypes, mapping.elementMappings, orderedElements, searchQuery, sortBy])

  const includedElementNames = useMemo(
    () => Object.entries(mapping.elementMappings)
      .filter(([_, config]) => config.include)
      .map(([name]) => name),
    [mapping.elementMappings]
  )

  const allSelected = visibleElements.length > 0 && visibleElements.every(et => selectedItems.has(et.name))
  const someSelected = selectedItems.size > 0 && !allSelected

  useEffect(() => {
    setSelectedItems(prev => {
      const allowed = new Set(visibleElements.map(et => et.name))
      const next = new Set<string>()
      prev.forEach(name => {
        if (allowed.has(name)) next.add(name)
      })
      return next
    })
  }, [visibleElements])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = orderedElements.indexOf(active.id as string)
    const newIndex = orderedElements.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      if (sortBy !== 'none') {
        setSortBy('none')
      }
      const newOrder = [...orderedElements]
      const [removed] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, removed)
      setOrderedElements(newOrder)
      setExpandedElements(prev => {
        const next = new Set(prev)
        next.delete(active.id as string)
        return next
      })
      setRecentlyDroppedId(active.id as string)
    }
  }

  return (
    <div className={cn('space-y-4 border rounded-lg p-4 bg-background', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-tight">Mapping</h3>
              {addingItems.size > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Adding {addingItems.size} item{addingItems.size !== 1 ? 's' : ''}...</span>
                </div>
              )}
              {removingItems.size > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Removing {removingItems.size} item{removingItems.size !== 1 ? 's' : ''}...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {visibleElements.length} of {analysis.elementTypes.length} elements selected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Custom Order</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="count-asc">Count (Low-High)</SelectItem>
              <SelectItem value="count-desc">Count (High-Low)</SelectItem>
            </SelectContent>
          </Select>
          {selectedItems.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleRemoveElements(Array.from(selectedItems))}
              disabled={removingItems.size > 0}
              title="Remove selected elements"
            >
              {removingItems.size > 0 ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin text-red-500" />
                  <span className="text-red-500">Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                  <span className="text-red-500">Remove</span>
                </>
              )}
            </Button>
          )}
          <div className="flex items-center gap-1.5">
            {expandedElements.size > 0 ? (
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronsDownUp className="h-3 w-3 text-muted-foreground" />
            )}
            <Switch
              id="expand-collapse-mapping"
              checked={expandedElements.size > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  expandAll()
                } else {
                  collapseAll()
                }
              }}
              className="scale-75"
              title={expandedElements.size > 0 ? 'Collapse All' : 'Expand All'}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 shrink-0 border-b pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mapped elements..."
            className="pl-8 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Root Node:</Label>
            <Select
              value={rootElementName || '__none__'}
              onValueChange={(value) => {
                setRootElementName(value === '__none__' ? null : value)
              }}
            >
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Select root node" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (Use XML root)</SelectItem>
                {includedElementNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleSelectAll(true)}
            disabled={visibleElements.length === 0 || allSelected}
            title="Select all visible elements"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleSelectAll(false)}
            disabled={selectedItems.size === 0}
            title="Deselect all"
          >
            <Square className="h-3 w-3 mr-1" />
            Deselect All
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleElements.map(et => et.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {visibleElements.map((elementType) => {
              const elementMapping = mapping.elementMappings[elementType.name]
              const isIncluded = elementMapping?.include ?? false
              const isRemoving = removingItems.has(elementType.name)
              return (
                <SortableMappingItem
                  key={elementType.name}
                  elementType={elementType}
                  elementMapping={elementMapping}
                  isIncluded={isIncluded}
                  isExpanded={expandedElements.has(elementType.name)}
                  isSelected={selectedItems.has(elementType.name)}
                  isRemoving={isRemoving}
                  onToggleExpand={() => toggleExpand(elementType.name)}
                  onSelectToggle={() => handleSelectItem(elementType.name)}
                  onUpdateElementMapping={updateElementMapping}
                  onUpdateAttributeMapping={updateAttributeMapping}
                  onUpdateRelationshipMapping={updateRelationshipMapping}
                  onAddRelationship={addRelationshipMapping}
                  onRemoveRelationship={removeRelationshipMapping}
                  onReplaceRelationshipKey={replaceRelationshipKey}
                  onAddCustomProperty={addCustomProperty}
                  onRemoveCustomProperty={removeCustomProperty}
                  onRenameCustomProperty={renameCustomProperty}
                  onRemoveElement={() => handleRemoveElements([elementType.name])}
                  mapping={mapping}
                  relationshipTargets={includedElementNames}
                  elementIncludeLookup={elementIncludeLookup}
                  recentlyDroppedId={recentlyDroppedId}
                  clearRecentlyDropped={() => setRecentlyDroppedId(null)}
                  analysis={analysis}
                  selectedOntologyId={selectedOntologyId}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  )
}


