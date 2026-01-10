import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'
import { evaluateExpression } from '../../../utils/jsonPathExpression'

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
    const propertyKey = ctx.evaluateTemplate(mapping.propertyKey, apiResponseData)
    let attrValue = ctx.xmlElement.getAttribute(mapping.attributeName)
    if (attrValue === null) {
      attrValue = mapping.defaultValue || ''
      if (mapping.defaultValue && mapping.defaultValue.includes('{{ $json.')) {
        const evaluated = evaluateExpression(mapping.defaultValue, { json: apiResponseData })
        attrValue = String(evaluated || attrValue)
      }
    }
    if (propertyKey && attrValue) {
      const normalized = ctx.applyTransforms(attrValue, mapping.transforms)
      ctx.currentGraphNode!.properties[propertyKey] = normalized
    }
  })
}

export function executeCreateNodeCompleteAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)

  // 1. Resolve Node (Upsert Logic)
  let graphNode: GraphJsonNode | undefined
  let isNewNode = true

  const uniqueIdTemplate = action.config.uniqueId as string
  if (uniqueIdTemplate) {
    const uniqueId = ctx.evaluateTemplate(uniqueIdTemplate, apiResponseData)
    // Check if node with this ID already exists in the current graph context
    // We check ctx.graphNodes. Note: This is an internal ID check, not a graph database query.
    // Ideally we might want to check against a "semantic ID" map if we maintained one.
    // For now, if the user provides a uniqueId, we can check if any node has a property that matches?
    // OR, we assume 'uniqueId' refers to our internal unique identifiers if they are managing them?
    // Actually, usually users want to deduplicate by a BUSINESS KEY (e.g. URI, or specific property).
    // But here 'uniqueId' config implies a direct lookup key.
    // Let's assume uniqueId maps to a special property '_id' or 'uri' or just checks properties?
    // Wait, the standard "getOrCreate" usually relies on a label + primary key.
    // Here we are just given a "Unique ID". 
    // Let's assume the user puts a value that we can check against `properties._id` or similar if we strictly enforced it.
    // BUT, a common pattern in this tool is that normalized IDs are stored in `elementToGraph` or similar maps.
    // Let's check if we can find a node with this ID in `graphNodes`.
    // Since graphNodes keys are numeric IDs usually, this `uniqueId` is likely a business key.

    // BETTER APPROACH: Check if any node in graphNodes has a property `_id` or `id` matching this value?
    // OR simpler: Allow the user to define what makes it unique. 
    // BUT for "Node Complete", the simple "Unique ID" field usually implies "Primary Key".
    // Let's assume it maps to a property called `id`.

    // However, if we want to support "update if exists", we need to know WHICH node.
    // Let's check if we have a node in `graphNodes` with `properties.id === uniqueId` OR `properties._id === uniqueId`.

    if (uniqueId) {
      graphNode = ctx.graphNodes.find(n => n.properties.id === uniqueId || n.properties._id === uniqueId)
      if (graphNode) {
        isNewNode = false
      }
    }
  }

  if (isNewNode) {
    const nodeId = ctx.nodeIdCounter.value++
    graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)

    const nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
    if (nodeLabel) {
      graphNode.labels = [nodeLabel]
    }

    ctx.graphNodes.push(graphNode)
    // Only map element if new? Or always?
    ctx.elementToGraph.set(ctx.xmlElement, graphNode)
  }

  // Ensure graphNode is defined (TS check)
  if (!graphNode) return // Should not happen given logic above

  // Set the "Unique ID" as a property if it was provided and we created a new node
  // This ensures subsequent lookups find it.
  if (uniqueIdTemplate && isNewNode) {
    const uniqueId = ctx.evaluateTemplate(uniqueIdTemplate, apiResponseData)
    if (uniqueId) {
      graphNode.properties.id = uniqueId // Defaulting to 'id' property for uniqueness
    }
  }

  ctx.currentGraphNode = graphNode

  // 2. Map Attributes (Properties)
  const attributeMappings = (action.config.attributeMappings as Array<{
    attributeName: string
    propertyKey: string
    transforms?: Array<{
      type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
      replaceFrom?: string
      replaceTo?: string
      regexPattern?: string
      regexReplacement?: string
    }>
    defaultValue?: string
  }>) || []

  attributeMappings.forEach(mapping => {
    let propertyKeyName: string
    let propertyValue: unknown = null

    const isTemplateExpression = mapping.propertyKey && mapping.propertyKey.includes('{{ $json.')

    if (isTemplateExpression && apiResponseData) {
      propertyKeyName = mapping.attributeName || 'value'
      const evaluated = evaluateExpression(mapping.propertyKey, { json: apiResponseData })
      propertyValue = evaluated
    } else if (mapping.attributeName) {
      propertyKeyName = mapping.propertyKey || mapping.attributeName
      let attrValue = ctx.xmlElement.getAttribute(mapping.attributeName)
      if (attrValue === null) {
        attrValue = mapping.defaultValue || ''
      }
      propertyValue = attrValue
    } else if (mapping.propertyKey) {
      propertyKeyName = mapping.propertyKey
      let attrValue = ctx.xmlElement.getAttribute(mapping.propertyKey)
      if (attrValue === null) {
        attrValue = mapping.defaultValue || ''
      }
      propertyValue = attrValue
    } else {
      return
    }

    if (propertyKeyName && propertyValue !== null && propertyValue !== undefined) {
      let finalValue = String(propertyValue)
      if (mapping.transforms && mapping.transforms.length > 0) {
        finalValue = ctx.applyTransforms(finalValue, mapping.transforms)
      }
      graphNode!.properties[propertyKeyName] = finalValue
    }
  })

  // 3. Create Relationship
  // Check for Custom Relationship Config first
  const relationshipConfig = action.config.relationship as {
    type: string
    targetNodeId: string
    targetNodeLabel?: string
    direction?: 'outgoing' | 'incoming'
  } | undefined

  if (relationshipConfig && relationshipConfig.targetNodeId) {
    // Custom Relationship Logic
    const targetId = ctx.evaluateTemplate(relationshipConfig.targetNodeId, apiResponseData)
    const relLabel = relationshipConfig.type || 'relatedTo'
    const direction = relationshipConfig.direction || 'outgoing'

    if (targetId) {
      // Find target node in current graph
      // Assuming targetId matches the 'id' or '_id' property we use for uniqueness
      const targetNode = ctx.graphNodes.find(n => n.properties.id === targetId || n.properties._id === targetId)

      if (targetNode) {
        // Create relationship immediately
        const startNode = direction === 'outgoing' ? graphNode : targetNode
        const endNode = direction === 'outgoing' ? targetNode : graphNode

        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relLabel,
          start: startNode.id,
          end: endNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      } else {
        // Target not found yet? Defer it?
        // The current context doesn't explicitly support a queue for "defer by property ID", 
        // only "defer by parent relationship".
        // But we can implement a basic deferral if needed, or just log warning.
        // For now, let's assume the user ensures topological sort or existence.
        // If we NEED deferral, we would push to a pending list.
        // Let's log for now.
        // console.warn(`Target node with ID ${targetId} not found for relationship ${relLabel}`)

        // Optionally create a "Placeholder" node if we want to ensure structural completeness?
        // No, simpler to just skip or fail.
        // But wait, if we are in a "Create Node Complete" action, maybe we shouldn't fail silently.
      }
    }
  } else if (ctx.parentGraphNode) {
    // Fallback: Parent Relationship (Backward Compatibility)
    const parentRelType = (action.config.parentRelationship as string) || 'contains'
    const relType = ctx.relationships.find(r => r.type === parentRelType)
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: parentRelType,
        start: ctx.parentGraphNode.id,
        end: graphNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
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

export function executeCreateConditionalNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const conditions = (action.config.conditions as Array<{
    type: 'hasAttribute' | 'hasText' | 'hasChildren'
    attributeName?: string
    attributeValue?: string
    minTextLength?: number
    childTag?: string
  }>) || []
  const operator = (action.config.operator as 'AND' | 'OR') || 'AND'

  let conditionMet = false
  if (conditions.length === 0) {
    conditionMet = true
  } else {
    const results = conditions.map(condition => {
      switch (condition.type) {
        case 'hasAttribute':
          if (!condition.attributeName) return false
          const attrName = ctx.evaluateTemplate(condition.attributeName, apiResponseData)
          const attrValue = ctx.xmlElement.getAttribute(attrName)
          if (condition.attributeValue) {
            const expectedValue = ctx.evaluateTemplate(condition.attributeValue, apiResponseData)
            return attrValue === expectedValue
          }
          return attrValue !== null
        case 'hasText':
          const minLength = condition.minTextLength || 1
          const text = (ctx.xmlElement.textContent || '').trim()
          return text.length >= minLength
        case 'hasChildren':
          if (!condition.childTag) return false
          const childTag = ctx.evaluateTemplate(condition.childTag, apiResponseData)
          const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
          return children.some(c => c.tagName.toLowerCase() === childTag.toLowerCase())
        default:
          return false
      }
    })

    conditionMet = operator === 'AND' ? results.every(r => r) : results.some(r => r)
  }

  if (!conditionMet) return

  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)

  const nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
  if (nodeLabel) {
    graphNode.labels = [nodeLabel]
  }

  ctx.graphNodes.push(graphNode)
  ctx.elementToGraph.set(ctx.xmlElement, graphNode)
  ctx.currentGraphNode = graphNode

  if (ctx.parentGraphNode) {
    const parentRelType = ctx.evaluateTemplate((action.config.parentRelationship as string) || 'contains', apiResponseData)
    const relType = ctx.relationships.find(r => r.type === parentRelType)
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: parentRelType,
        start: ctx.parentGraphNode.id,
        end: graphNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
    }
  }
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
    case 'sum':
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
      computed = nums.reduce((sum, n) => sum + n, 0)
      break
  }

  ctx.currentGraphNode.properties[propertyKey] = computed
}

export function executeNormalizeAndDeduplicateAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const sourceProperty = (action.config.sourceProperty as string) || ''
  const targetProperty = (action.config.targetProperty as string) || ''
  const transforms = (action.config.transforms as Array<{
    type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
    replaceFrom?: string
    replaceTo?: string
    regexPattern?: string
    regexReplacement?: string
  }>) || []
  const deduplicate = (action.config.deduplicate as boolean) ?? true

  if (!sourceProperty || !targetProperty) return

  const sourceValue = ctx.currentGraphNode.properties[sourceProperty]
  if (sourceValue === undefined) return

  let values: string[] = []
  if (Array.isArray(sourceValue)) {
    values = sourceValue.map(v => String(v))
  } else {
    const str = String(sourceValue)
    values = str.includes(',') ? str.split(',').map(v => v.trim()) : [str]
  }

  let normalized = values.map(v => ctx.applyTransforms(v, transforms))
  if (deduplicate) {
    normalized = Array.from(new Set(normalized))
  }

  ctx.currentGraphNode.properties[targetProperty] = normalized.length === 1 ? normalized[0] : normalized
}

