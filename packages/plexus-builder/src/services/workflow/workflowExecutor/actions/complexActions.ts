import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'
import { evaluateExpression } from '../../../../utils/jsonPathExpression'
import type { Transform } from '../helpers/transformHelpers'

export function executeExtractAndNormalizeAttributesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)

  const attributeMappings = (action.config.attributeMappings as Array<{
    attributeName: string
    propertyKey: string
    transforms: Array<{
      type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
      replaceFrom?: string
      replaceTo?: string
      regexPattern?: string
      regexReplacement?: string
    }>
    defaultValue?: string
  }>) || []

  attributeMappings.forEach(mapping => {
    const propertyKey = mapping.propertyKey
      ? ctx.evaluateTemplate(mapping.propertyKey, apiResponseData)
      : mapping.attributeName

    let attrValue = ctx.xmlElement.getAttribute(mapping.attributeName)
    // Use default value if attribute is missing OR if it is an empty string
    if (attrValue === null || attrValue === '') {
      const defaultValue = mapping.defaultValue !== undefined ? mapping.defaultValue : null
      if (defaultValue !== null) {
        attrValue = defaultValue
        if (attrValue.includes('{{ $json.')) {
          const evaluated = evaluateExpression(attrValue, { json: apiResponseData })
          attrValue = String(evaluated || attrValue)
        }
      }
    }

    if (propertyKey && attrValue !== null) {
      const normalized = ctx.applyTransforms(attrValue, mapping.transforms)
      ctx.currentGraphNode!.properties[propertyKey] = normalized

      // If removeOriginal is set and we mapped to a different key, remove the raw attribute property
      if (action.config.removeOriginal && propertyKey !== mapping.attributeName) {
        delete ctx.currentGraphNode!.properties[mapping.attributeName]
      }
    }
  })
}

export function executeCreateNodeCompleteAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  
  // Capture the node that "owns" this action execution (the anchor point)
  const originNode = ctx.currentGraphNode || ctx.parentGraphNode

  // 1. Resolve Node (Upsert Logic)
  let graphNode: GraphJsonNode | undefined
  let isNewNode = true

  const uniqueIdTemplate = action.config.uniqueId as string
  if (uniqueIdTemplate) {
    const uniqueId = ctx.evaluateTemplate(uniqueIdTemplate, apiResponseData)
    if (uniqueId) {
      graphNode = ctx.graphNodes.find(n => n.properties.id === uniqueId || n.properties._id === uniqueId)
      if (graphNode) {
        isNewNode = false
      }
    }
  }

  if (isNewNode) {
    const nodeId = ctx.nodeIdCounter.value++
    const inheritProperties = action.config.inheritProperties !== false
    graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId, { inheritProperties })

    let nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
    
    if (action.config.labelTransforms && Array.isArray(action.config.labelTransforms)) {
      nodeLabel = ctx.applyTransforms(nodeLabel, action.config.labelTransforms)
    }

    if (nodeLabel) {
      graphNode.labels = [nodeLabel]
    }

    ctx.graphNodes.push(graphNode)
    if (!ctx.currentGraphNode) {
      ctx.elementToGraph.set(ctx.xmlElement, graphNode)
    }
  }

  if (!graphNode) return

  // Set the "Unique ID" as a property if it was provided and we created a new node
  // This ensures subsequent lookups find it.
  if (uniqueIdTemplate && isNewNode) {
    const uniqueId = ctx.evaluateTemplate(uniqueIdTemplate, apiResponseData)
    if (uniqueId) {
      graphNode.properties.id = uniqueId // Defaulting to 'id' property for uniqueness
    }
  }

  if (!ctx.currentGraphNode) {
    ctx.currentGraphNode = graphNode
  }

  // 2. Map Attributes (Properties)
  // Defensively retrieve mappings from either 'properties' or 'attributeMappings'
  const rawMappings = action.config.properties || action.config.attributeMappings || []
  const attributeMappings = Array.isArray(rawMappings) ? rawMappings : []

  for (const mapping of attributeMappings) {
    if (!mapping) continue

    // A. Resolve Source Value (The actual content)
    const sourceVal = mapping.attributeName || mapping.value || ''
    const valResult: any = ctx.evaluateTemplate(sourceVal, apiResponseData)
    
    // B. Resolve Target Key (The name in graph)
    let targetKey = mapping.propertyKey || mapping.key || ''
    if (!targetKey && sourceVal) {
      if (!sourceVal.includes('{{') && !sourceVal.startsWith('@')) {
        targetKey = sourceVal
      } else {
        targetKey = 'value'
      }
    }

    if (targetKey) {
      targetKey = ctx.evaluateTemplate(targetKey, apiResponseData)
    }

    // C. Save to graph
    if (targetKey && targetKey.trim()) {
      let finalString = valResult !== null && valResult !== undefined ? String(valResult) : (mapping.defaultValue || '')
      if (mapping.transforms && mapping.transforms.length > 0) {
        finalString = ctx.applyTransforms(finalString, mapping.transforms)
      }
      graphNode.properties[targetKey] = finalString
    }
  }

  // 3. Relationship Creation
  const relMode = (action.config.relationshipMode as string) || 'connected'
  let relType = ctx.evaluateTemplate((action.config.relationshipType as string) || 'contains', apiResponseData)
  
  if (relMode === 'standalone') {
    // Do nothing
  } else if (relMode === 'connected' && originNode) {
    const direction = (action.config.relationshipDirection as string) || 'outgoing'
    const startNode = direction === 'outgoing' ? originNode : graphNode
    const endNode = direction === 'outgoing' ? graphNode : originNode

    const rel: GraphJsonRelationship = {
      id: ctx.relIdCounter.value++,
      type: 'relationship',
      label: relType,
      start: startNode.id,
      end: endNode.id,
      properties: {}
    }
    ctx.graphRels.push(rel)
  } else if (relMode === 'deferred') {
    const lookupKey = action.config.lookupProperty as string
    const lookupValue = action.config.lookupValue ? ctx.evaluateTemplate(action.config.lookupValue as string, apiResponseData) : undefined
    const targetLabel = action.config.targetNodeLabel as string
    const targetId = action.config.targetNodeId ? ctx.evaluateTemplate(action.config.targetNodeId as string, apiResponseData) : undefined
    const direction = (action.config.relationshipDirection as string) || 'outgoing'
    
    if (lookupKey && lookupValue) {
      ctx.deferredRelationships.push({
        from: graphNode,
        to: null,
        type: relType,
        properties: {},
        targetLookup: {
          label: targetLabel,
          propertyKey: lookupKey,
          propertyValue: lookupValue
        },
        direction: direction as any
      })
    } else if (targetId) {
      ctx.deferredRelationships.push({
        from: graphNode,
        to: null,
        type: relType,
        properties: {},
        targetId: targetId,
        direction: direction as any
      })
    }
  }
}

export function executeMergeChildrenTextAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const propertyKey = (action.config.propertyKey as string) || 'text'
  const separator = (action.config.separator as string) || ' '
  const filterByTag = (action.config.filterByTag as string[]) || []
  const excludeTags = (action.config.excludeTags as string[]) || []
  const transforms = (action.config.transforms as Array<{
    type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
    replaceFrom?: string
    replaceTo?: string
    regexPattern?: string
    regexReplacement?: string
  }>) || []

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  const texts: string[] = []

  children.forEach((child) => {
    const tag = child.tagName ? child.tagName.toLowerCase() : ''
    if (excludeTags.includes(tag)) return
    if (filterByTag.length > 0 && !filterByTag.includes(tag)) return
    const text = child.textContent || ''
    if (text.trim()) {
      texts.push(text.trim())
    }
  })

  const merged = texts.join(separator)
  const transformed = ctx.applyTransforms(merged, transforms)
  ctx.currentGraphNode.properties[propertyKey] = transformed
}

export function executeExtractAndComputePropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const propertyKey = ctx.evaluateTemplate((action.config.propertyKey as string) || '', apiResponseData)
  const sources = (action.config.sources as Array<{
    type: 'textContent' | 'attribute' | 'static'
    attributeName?: string
    staticValue?: string
  }>) || []
  const computation = (action.config.computation as 'concat' | 'sum' | 'join') || 'concat'
  const separator = ctx.evaluateTemplate((action.config.separator as string) || ' ', apiResponseData)

  if (!propertyKey || sources.length === 0) return

  const values: string[] = []
  sources.forEach(source => {
    let value = ''
    switch (source.type) {
      case 'textContent':
        value = ctx.xmlElement.textContent || ''
        break
      case 'attribute':
        if (source.attributeName) {
          const attrName = ctx.evaluateTemplate(source.attributeName, apiResponseData)
          value = ctx.xmlElement.getAttribute(attrName) || ''
        }
        break
      case 'static':
        value = ctx.evaluateTemplate(source.staticValue || '', apiResponseData)
        break
    }
    if (value) {
      values.push(value)
    }
  })

  let computed: string | number = ''
  switch (computation) {
    case 'concat':
      computed = values.join('')
      break
    case 'join':
      computed = values.join(separator)
      break
    case 'sum': {
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
      computed = nums.reduce((sum, n) => sum + n, 0)
      break
    }
  }

  ctx.currentGraphNode.properties[propertyKey] = computed
}

export function executeCreateNodeWithLookupAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  
  const lookupKey = ctx.evaluateTemplate((action.config.lookupPropertyKey as string), apiResponseData)
  const lookupValue = ctx.evaluateTemplate((action.config.lookupPropertyValue as string), apiResponseData)

  // Early Exit Check 1: If searching by property but value is mysteriously empty, skip node creation entirely.
  if (lookupKey && (!lookupValue || String(lookupValue).trim() === '')) {
    return
  }

  // Early Exit Check 2: If it's an ID lookup and ID doesn't exist in XML, skip node creation entirely.
  if (lookupKey === 'id' || lookupKey === 'xml:id' || lookupKey === 'xmlid' || lookupKey === 'uri') {
    const targetExists = ctx.findElementById(ctx.doc, lookupValue)
    if (!targetExists) {
      return
    }
  }

  // Always create a NEW separate node for the lookup action, do NOT overwrite ctx.currentGraphNode!
  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId, {
    inheritProperties: action.config.inheritProperties !== false
  })
  
  let nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
  
  if (action.config.labelTransforms && Array.isArray(action.config.labelTransforms)) {
    nodeLabel = ctx.applyTransforms(nodeLabel, action.config.labelTransforms)
  }

  if (nodeLabel) {
    graphNode.labels = [nodeLabel]
  }

  const mappings = (action.config.attributeMappings as any[]) || []
  mappings.forEach(m => {
    const attributeName = ctx.evaluateTemplate(m.attributeName, apiResponseData)
    const propertyKey = ctx.evaluateTemplate(m.propertyKey || m.attributeName, apiResponseData)
    const val = ctx.xmlElement.getAttribute(attributeName) || m.defaultValue
    
    if (val !== null && val !== undefined) {
      graphNode.properties[propertyKey] = val
    }
  })

  // Add the newly created node to the graph
  ctx.graphNodes.push(graphNode)
  
  // Note: We deliberately do NOT update ctx.currentGraphNode here. This node is intended to be 
  // freestanding, connected only to its lookup target via the deferred relationship.

  // Defer relationship with lookup target
  const direction = (action.config.direction as 'outgoing' | 'incoming') || 'outgoing'
  const lookupLabel = ctx.evaluateTemplate((action.config.lookupLabel as string), apiResponseData)

  ctx.deferredRelationships.push({
    from: graphNode,
    to: null,
    type: ctx.evaluateTemplate((action.config.relationshipType as string) || 'relatedTo', apiResponseData),
    properties: {},
    targetLookup: {
      label: lookupLabel,
      propertyKey: lookupKey,
      propertyValue: lookupValue
    },
    direction: direction,
    mustResolve: true // Always treat as mandatory for this action, dropping graphNode if unresolved
  })
}



