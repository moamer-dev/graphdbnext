import { useState, useEffect, useMemo, useRef } from 'react'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../services/xmlAnalyzer'
import { XmlAnalyzer } from '../../services/xmlAnalyzer'

interface UseXmlMappingStateProps {
  analysis: XmlStructureAnalysis
  initialMapping?: XmlMappingConfig
  onMappingChange: (mapping: XmlMappingConfig) => void
}

export function useXmlMappingState({
  analysis,
  initialMapping,
  onMappingChange
}: UseXmlMappingStateProps) {
  const [mapping, setMapping] = useState<XmlMappingConfig>(
    initialMapping || {
      elementMappings: {},
      attributeMappings: {},
      relationshipMappings: {},
      textContentMappings: {}
    }
  )
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())
  const [orderedElements, setOrderedElements] = useState<string[]>(() => 
    analysis.elementTypes.map(et => et.name)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'none' | 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc'>('none')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<string | null>(null)
  
  const prevMappingRef = useRef<XmlMappingConfig | undefined>(initialMapping)
  const prevAnalysisElementTypesRef = useRef(analysis.elementTypes)
  const hasInitializedDefaultMapping = useRef(false)
  
  // Sync mapping when initialMapping prop changes
  useEffect(() => {
    if (initialMapping && initialMapping !== prevMappingRef.current) {
      prevMappingRef.current = initialMapping
      setMapping(initialMapping)
    }
  }, [initialMapping])

  // Sync orderedElements when analysis.elementTypes changes
  useEffect(() => {
    const currentNames = new Set(analysis.elementTypes.map(et => et.name))
    const prevNames = new Set(prevAnalysisElementTypesRef.current.map(et => et.name))
    
    // Only update if element types actually changed
    if (currentNames.size !== prevNames.size || 
        ![...currentNames].every(name => prevNames.has(name))) {
      setOrderedElements(prev => {
        const filtered = prev.filter(name => currentNames.has(name))
        const newElements = analysis.elementTypes
          .map(et => et.name)
          .filter(name => !prev.includes(name))
        return [...filtered, ...newElements]
      })
      prevAnalysisElementTypesRef.current = analysis.elementTypes
    }
  }, [analysis.elementTypes])

  // Initialize default mapping once when no initialMapping is provided
  useEffect(() => {
    if (!hasInitializedDefaultMapping.current && !initialMapping && analysis) {
      const defaultMapping = XmlAnalyzer.generateDefaultMapping(analysis)
      setMapping(defaultMapping)
      onMappingChange(defaultMapping)
      hasInitializedDefaultMapping.current = true
    }
  }, [analysis, initialMapping, onMappingChange])

  const updateElementMapping = (elementName: string, updates: Partial<XmlMappingConfig['elementMappings'][string]>) => {
    const newMapping = { ...mapping }
    if (!newMapping.elementMappings[elementName]) {
      newMapping.elementMappings[elementName] = {
        include: false,
        nodeLabel: elementName,
        nodeType: elementName,
        superclassNames: []
      }
    }
    newMapping.elementMappings[elementName] = {
      ...newMapping.elementMappings[elementName],
      ...updates
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const addCustomProperty = (elementName: string, propertyKey: string) => {
    if (!propertyKey.trim()) return
    const newMapping = { ...mapping }
    if (!newMapping.elementMappings[elementName]) {
      newMapping.elementMappings[elementName] = {
        include: false,
        nodeLabel: elementName,
        nodeType: elementName,
        superclassNames: []
      }
    }
    if (!newMapping.attributeMappings[elementName]) {
      newMapping.attributeMappings[elementName] = {}
    }
    if (!newMapping.attributeMappings[elementName][propertyKey]) {
      newMapping.attributeMappings[elementName][propertyKey] = {
        include: true,
        propertyKey: propertyKey,
        propertyType: 'string',
        required: false,
        isReference: false
      }
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const removeCustomProperty = (elementName: string, propertyKey: string) => {
    const newMapping = { ...mapping }
    const elementType = analysis.elementTypes.find((et) => et.name === elementName)
    const isRealAttribute = elementType?.attributes.includes(propertyKey)
    
    if (!isRealAttribute && newMapping.attributeMappings[elementName]) {
      delete newMapping.attributeMappings[elementName][propertyKey]
      setMapping(newMapping)
      onMappingChange(newMapping)
    }
  }

  const renameCustomProperty = (elementName: string, oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return
    const newMapping = { ...mapping }
    if (!newMapping.attributeMappings[elementName]) {
      newMapping.attributeMappings[elementName] = {}
    }
    const propMapping = newMapping.attributeMappings[elementName][oldKey]
    if (propMapping) {
      newMapping.attributeMappings[elementName][newKey] = {
        ...propMapping,
        propertyKey: newKey
      }
      delete newMapping.attributeMappings[elementName][oldKey]
      setMapping(newMapping)
      onMappingChange(newMapping)
    }
  }

  const updateAttributeMapping = (
    elementName: string,
    attrName: string,
    updates: Partial<XmlMappingConfig['attributeMappings'][string][string]>
  ) => {
    const newMapping = { ...mapping }
    if (!newMapping.attributeMappings[elementName]) {
      newMapping.attributeMappings[elementName] = {}
    }
    if (!newMapping.attributeMappings[elementName][attrName]) {
      const elementType = analysis.elementTypes.find((et) => et.name === elementName)
      const attrAnalysis = elementType?.attributeAnalysis[attrName]
      const attrType = attrAnalysis?.type || 'string'
      newMapping.attributeMappings[elementName][attrName] = {
        include: true,
        propertyKey: attrName,
        propertyType: (attrType === 'id-reference' || attrType === 'xpath-reference') ? 'string' : attrType,
        required: attrAnalysis?.required || false,
        isReference: attrAnalysis?.isReference || false
      }
    }
    newMapping.attributeMappings[elementName][attrName] = {
      ...newMapping.attributeMappings[elementName][attrName],
      ...updates
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const updateRelationshipMapping = (
    relKey: string,
    updates: Partial<XmlMappingConfig['relationshipMappings'][string]>
  ) => {
    const newMapping = { ...mapping }
    if (!newMapping.relationshipMappings[relKey]) {
      newMapping.relationshipMappings[relKey] = {
        include: false,
        relationshipType: 'contains'
      }
    }
    newMapping.relationshipMappings[relKey] = {
      ...newMapping.relationshipMappings[relKey],
      ...updates
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const addRelationshipMapping = (elementName: string, targetName: string) => {
    if (!targetName) return
    let relKey = `${elementName}->${targetName}`
    let counter = 1
    while (mapping.relationshipMappings[relKey]) {
      relKey = `${elementName}->${targetName}-${counter++}`
    }
    const newMapping: XmlMappingConfig = {
      ...mapping,
      relationshipMappings: {
        ...mapping.relationshipMappings,
        [relKey]: {
          include: true,
          relationshipType: 'relatedTo'
        }
      }
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const removeRelationshipMapping = (relKey: string) => {
    const newRel = { ...mapping.relationshipMappings }
    delete newRel[relKey]
    const newMapping = { ...mapping, relationshipMappings: newRel }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const replaceRelationshipKey = (oldKey: string, newKey: string) => {
    if (!oldKey || !newKey || oldKey === newKey) return
    const rel = mapping.relationshipMappings[oldKey]
    if (!rel) return
    const newRel = { ...mapping.relationshipMappings }
    delete newRel[oldKey]
    newRel[newKey] = rel
    const newMapping = { ...mapping, relationshipMappings: newRel }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const elementIncludeLookup = useMemo(() => {
    const map = new Map<string, boolean>()
    Object.entries(mapping.elementMappings).forEach(([name, config]) => {
      map.set(name, !!config?.include)
    })
    return map
  }, [mapping.elementMappings])

  const toggleExpand = (elementName: string) => {
    const newExpanded = new Set(expandedElements)
    if (newExpanded.has(elementName)) {
      newExpanded.delete(elementName)
    } else {
      newExpanded.add(elementName)
    }
    setExpandedElements(newExpanded)
  }

  const expandAll = () => {
    const allNames = new Set(analysis.elementTypes.map(et => et.name))
    setExpandedElements(allNames)
  }

  const collapseAll = () => {
    setExpandedElements(new Set())
  }

  const handleSelectItem = (name: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const selectAll = () => {
    const allNames = new Set(orderedElements)
    setSelectedItems(allNames)
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  return {
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
    selectAll,
    deselectAll,
    setOrderedElements,
    setExpandedElements
  }
}

