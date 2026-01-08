import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'

export function executeCreateAnnotationAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const annotationTypes = (action.config.annotationTypes as string[]) || []
  
  annotationTypes.forEach(attrName => {
    const value = ctx.xmlElement.getAttribute(attrName)
    if (value && ctx.currentGraphNode) {
      const annotationNode: GraphJsonNode = {
        id: ctx.nodeIdCounter.value++,
        type: 'node',
        labels: ['Thing', 'Annotation'],
        properties: {
          content: value,
          mimeType: 'text/plain',
          type: attrName
        }
      }
      ctx.graphNodes.push(annotationNode)

      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: 'annotates',
        start: ctx.currentGraphNode.id,
        end: annotationNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
    }
  })
}

export function executeCreateReferenceAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const referenceAttribute = (action.config.referenceAttribute as string) || 'corresp'
  const relationshipType = (action.config.relationshipType as string) || 'refersTo'
  const value = ctx.xmlElement.getAttribute(referenceAttribute)

  if (value && ctx.currentGraphNode) {
    const cleanId = value.replace('#', '').split(' ')[0]
    const targetElement = ctx.findElementById(ctx.doc, cleanId)
    if (targetElement) {
      const targetNode = ctx.elementToGraph.get(targetElement)
      if (targetNode) {
        const relType = ctx.relationships.find(r => r.type === relationshipType) || ctx.relationships[0]
        if (relType) {
          const rel = ctx.createRelationship(ctx.currentGraphNode, targetNode, relType)
          ctx.graphRels.push(rel)
        }
      }
    }
  }
}

export function executeCreateAnnotationNodesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode || !ctx.currentGraphNode) return

  const annotationNodeLabel = (action.config.annotationNodeLabel as string) || 'Annotation'
  const targetAttributes = (action.config.targetAttributes as string[]) || []
  const relationshipType = (action.config.relationshipType as string) || 'annotatedBy'

  const currentNode = ctx.currentGraphNode

  targetAttributes.forEach(attrName => {
    const attrValue = ctx.xmlElement.getAttribute(attrName)
    if (attrValue) {
      const annotationNode: GraphJsonNode = {
        id: ctx.nodeIdCounter.value++,
        type: 'node',
        labels: [annotationNodeLabel],
        properties: {
          type: attrName,
          value: attrValue
        }
      }
      ctx.graphNodes.push(annotationNode)

      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(currentNode, annotationNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: currentNode.id,
          end: annotationNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    }
  })
}

export function executeCreateReferenceChainAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const referenceAttribute = (action.config.referenceAttribute as string) || 'corresp'
  const targetNodeLabel = (action.config.targetNodeLabel as string) || ''
  const relationshipType = (action.config.relationshipType as string) || 'refersTo'
  const resolveStrategy = (action.config.resolveStrategy as 'id' | 'xpath') || 'id'
  const createTargetIfMissing = (action.config.createTargetIfMissing as boolean) ?? false

  const refValue = ctx.xmlElement.getAttribute(referenceAttribute)
  if (!refValue) return

  const cleanId = refValue.replace('#', '').split(' ')[0]
  let targetElement: Element | null = null

  if (resolveStrategy === 'id') {
    targetElement = ctx.findElementById(ctx.doc, cleanId)
  } else {
    targetElement = ctx.doc.querySelector(`[xml\\:id="${cleanId}"]`) || ctx.doc.querySelector(`[id="${cleanId}"]`)
  }

  if (targetElement) {
    const targetNode = ctx.elementToGraph.get(targetElement)
    if (targetNode) {
      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(ctx.currentGraphNode, targetNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: ctx.currentGraphNode.id,
          end: targetNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    } else if (createTargetIfMissing && targetNodeLabel) {
      const targetNode: GraphJsonNode = {
        id: ctx.nodeIdCounter.value++,
        type: 'node',
        labels: [targetNodeLabel],
        properties: { id: cleanId }
      }
      ctx.graphNodes.push(targetNode)
      ctx.elementToGraph.set(targetElement, targetNode)

      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(ctx.currentGraphNode, targetNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: ctx.currentGraphNode.id,
          end: targetNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    }
  }
}

export function executeExtractXmlContentAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const includeAttributes = (action.config.includeAttributes as boolean) ?? true
  const includeChildren = (action.config.includeChildren as boolean) ?? true

  if (ctx.currentGraphNode) {
    if (includeAttributes && includeChildren) {
      ctx.currentGraphNode.properties.xmlContent = ctx.xmlElement.outerHTML
    } else if (includeAttributes) {
      const attrs = Array.from(ctx.xmlElement.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ')
      ctx.currentGraphNode.properties.xmlContent = `<${ctx.xmlElement.tagName} ${attrs} />`
    }
  }
}

