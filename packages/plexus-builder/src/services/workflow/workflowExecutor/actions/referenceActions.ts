import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'


export function executeCreateReferenceAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  // 1. Ensure current node exists
  // For this action, we expect to be running on a node that was already created for this element
  const currentNode = ctx.currentGraphNode
  if (!currentNode) return

  const apiResponseData = ctx.getApiResponseData(action)

  // 2. Override Node Label (Optional)
  if (action.config.nodeLabel) {
    let nodeLabel = ctx.evaluateTemplate(action.config.nodeLabel as string, apiResponseData)
    
    if (action.config.labelTransforms && Array.isArray(action.config.labelTransforms)) {
      nodeLabel = ctx.applyTransforms(nodeLabel, action.config.labelTransforms)
    }

    if (nodeLabel) {
      currentNode.labels = [nodeLabel]
    }
  }

  // 3. Add Additional Properties (Mappings)
  const rawProperties = (action.config.properties || []) as any[]
  rawProperties.forEach(mapping => {
    if (!mapping) return
    const sourceVal = mapping.attributeName || mapping.value || ''
    const val = ctx.evaluateTemplate(sourceVal, apiResponseData)
    
    let key = mapping.propertyKey || mapping.key || ''
    if (!key && sourceVal && !sourceVal.includes('{{') && !sourceVal.startsWith('@')) {
      key = sourceVal
    } else if (!key) {
      key = 'value'
    }

    if (key && val !== null && val !== undefined) {
      currentNode.properties[key] = String(val)
    }
  })

  // 4. Create References to target nodes
  const relationshipType = (action.config.relationshipType as string) || 'annotates'
  const annotationPath = (action.config.annotationPath as string) || ''

  // Strictly Handle Reference Linking
  let attrValue: string | null = null

  if (annotationPath) {
    attrValue = ctx.xmlElement.getAttribute(annotationPath)
  } else {
    // Auto-detect common reference attributes
    const commonAttributes = ['target', 'corresp', 'ref', 'ana']
    for (const attr of commonAttributes) {
      attrValue = ctx.xmlElement.getAttribute(attr)
      if (attrValue) break
    }
  }

  if (attrValue) {
    // Support multiple space-separated IDs like target="#w1 #w2"
    const ids = attrValue.trim().split(/\s+/).map(id => id.replace(/^#/, '')).filter(Boolean)
    
    ids.forEach(cleanId => {
      const targetElement = ctx.findElementById(ctx.doc, cleanId)

      // Always defer to handle multiple matches (e.g., inherited IDs on child nodes)
      // and to ensure all nodes are created before linking.
      ctx.deferredRelationships.push({
        from: currentNode,
        to: null,
        type: relationshipType,
        properties: {},
        targetId: cleanId,
        targetElement: targetElement || undefined,
        direction: 'outgoing',
        mustResolve: true
      })
    })
  }
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



