import { DOMParser } from '@xmldom/xmldom'
import type { Node as BuilderNode, Relationship } from '../../../types'
import type { ToolCanvasNode, ToolCanvasEdge } from '../../../stores/toolCanvasStore'
import type { ActionCanvasNode, ActionCanvasEdge } from '../../../stores/actionCanvasStore'
import type { GraphJson, GraphJsonNode, GraphJsonRelationship, ExecuteOptions, ExecutionContext } from './types'

import { executeTool } from './tools'
import { executeActionWithWalk, type SpecialActionExecutionContext } from './actions'
import { createGraphNode, createRelationship } from './helpers/graphHelpers'
import { createGetApiResponseData } from './helpers/apiHelpers'
import { evaluateTemplate } from './helpers/templateHelpers'
import { applyTransforms } from './helpers/transformHelpers'
import { findElementById, buildLabelMap, findElementByTag } from './helpers/elementHelpers'

export async function executeWorkflow(options: ExecuteOptions): Promise<GraphJson> {
  const {
    xmlContent,
    schemaJson,
    nodes,
    relationships,
    toolNodes,
    toolEdges,
    actionNodes,
    actionEdges,
    startNodeId
  } = options

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'text/xml')
  let root: Element | null = doc.documentElement

  if (!root) {
    return []
  }

  const graphNodes: GraphJsonNode[] = []
  const graphRels: GraphJsonRelationship[] = []
  const elementToGraph = new Map<Element, GraphJsonNode>()
  const nodeIdCounter = { value: 0 }
  const relIdCounter = { value: 0 }
  const deferredRelationships: Array<{
    from: GraphJsonNode
    to: GraphJsonNode | null
    type: string
    properties: Record<string, unknown>
    targetId?: string
    targetElement?: Element
    targetLookup?: {
      label?: string
      propertyKey?: string
      propertyValue?: string
    }
    direction?: 'outgoing' | 'incoming'
    mustResolve?: boolean
  }> = []
  const deferredOperations: ExecutionContext['deferredOperations'] = []

  const labelToNodes = buildLabelMap(nodes)
  const nodeIdToNode = new Map(nodes.map(n => [n.id, n]))

  if (startNodeId && root) {
    const startNode = nodeIdToNode.get(startNodeId)
    if (startNode) {
      const startTag = startNode.label.toLowerCase()
      const findElementByTagRecursive = (element: Element, tag: string): Element | null => {
        const localName = element.tagName.toLowerCase()
        const elementLocalName = localName.includes(':') ? localName.split(':').pop() || localName : localName
        if (elementLocalName === tag) {
          return element
        }
        const children = element.childNodes ? Array.from(element.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
        for (const child of children) {
          const found = findElementByTagRecursive(child, tag)
          if (found) return found
        }
        return null
      }
      const foundElement = findElementByTagRecursive(root, startTag)
      if (foundElement) {
        root = foundElement
      }
    }
  }

  const toolNodesByTarget = new Map<string, ToolCanvasNode[]>()
  const toolEdgesBySource = new Map<string, ToolCanvasEdge[]>()
  const actionEdgesBySource = new Map<string, ActionCanvasEdge[]>()

  toolNodes.forEach(tool => {
    if (tool.targetNodeId) {
      const existing = toolNodesByTarget.get(tool.targetNodeId) || []
      toolNodesByTarget.set(tool.targetNodeId, [...existing, tool])
    }
  })

  toolEdges.forEach(edge => {
    const existing = toolEdgesBySource.get(edge.source) || []
    toolEdgesBySource.set(edge.source, [...existing, edge])
  })

  actionEdges.forEach(edge => {
    const existing = actionEdgesBySource.get(edge.source) || []
    actionEdgesBySource.set(edge.source, [...existing, edge])
  })

  const createGraphNodeWrapper = (
    builderNode: { label: string; properties?: Array<{ key: string; defaultValue?: unknown }> },
    element: Element,
    id: number,
    options?: { inheritProperties?: boolean }
  ): GraphJsonNode => {
    return createGraphNode(builderNode as BuilderNode, element, id, schemaJson, options)
  }

  const createRelationshipWrapper = (
    from: GraphJsonNode,
    to: GraphJsonNode,
    relType: Relationship,
    properties: Record<string, unknown> = {}
  ): GraphJsonRelationship => {
    return createRelationship(from, to, relType, relIdCounter, properties)
  }

  const getApiResponseDataWrapper = createGetApiResponseData(toolNodes, actionNodes, actionEdges)

  const applyTransformsWrapper = (text: string, transforms: Array<{ type: string;[key: string]: unknown }>): string => {
    return applyTransforms(text, transforms as Array<{ type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex';[key: string]: unknown }>)
  }

  const walk = async (element: Element, parentGraphNode: GraphJsonNode | null, depth: number = 0) => {
    try {
      if (depth > 10000) {
        return
      }

      if (!element) {
        return
      }

      const tag = element.tagName ? element.tagName.toLowerCase() : 'unknown'
      const matchedNodes = labelToNodes.get(tag) || []

      if (matchedNodes.length === 0 && tag !== 'root') {
        const children = element.childNodes ? Array.from(element.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
        for (const child of children) {
          await walk(child as Element, parentGraphNode, depth + 1)
        }
        return
      }

      let createdForElement: GraphJsonNode | null = null
      let elementSkipped = false
      let skipChildrenConfig: { skip: boolean; tags: string[] } = { skip: false, tags: [] }
      let skipChildrenElementsConfig: Element[] = []
      let includeChildrenTagsConfig: string[] = []
      let childrenRangeConfig: { start?: number; end?: number; limit?: number; offset?: number } | null = null

      // Helper to find relationship type between parent and child based on labels
      const findRelType = (fromLabel: string, toLabel: string): Relationship | undefined => {
        // 1. Try to find explicit relationship between types
        const match = relationships.find(r => {
          const fromNode = nodeIdToNode.get(r.from)
          const toNode = nodeIdToNode.get(r.to)
          return fromNode && toNode &&
            fromNode.label === fromLabel &&
            toNode.label === toLabel
        })
        if (match) return match

        // 2. Fallback to generic 'contains' only
        return relationships.find(r => r.type === 'contains')
      }

      for (const builderNode of matchedNodes) {
        if (elementSkipped) {
          return
        }

        const ctx: ExecutionContext = {
          xmlDocument: doc,
          xmlElement: element,
          parentGraphNode,
          currentGraphNode: elementToGraph.get(element) || null,
          builderNode,
          elementToGraph,
          deferredRelationships,
          deferredOperations,
          skipped: false,
          findRelationship: findRelType
        }

        const actionCtx = {
          ...ctx,
          graphNodes,
          graphRels,
          nodeIdCounter,
          relIdCounter,
          relationships,
          schemaJson,
          doc,
          createGraphNode: createGraphNodeWrapper,
          createRelationship: createRelationshipWrapper,
          getApiResponseData: (action) => getApiResponseDataWrapper(action, ctx),
          evaluateTemplate: (val: string, data: unknown) => evaluateTemplate(val, data, element),
          applyTransforms: applyTransformsWrapper,
          findElementById,
          walk,
          labelToNodes,
          actionNodes,
          actionEdgesBySource
        } as SpecialActionExecutionContext

        // 1. Ensure the primary node for this element exists BEFORE actions/tools run.
        if (ctx.currentGraphNode === null) {
          const nodeId = nodeIdCounter.value++
          const graphNode = createGraphNodeWrapper(builderNode, element, nodeId)
          graphNodes.push(graphNode)
          elementToGraph.set(element, graphNode)
          ctx.currentGraphNode = graphNode
          createdForElement = graphNode

          if (parentGraphNode) {
            const relDef = findRelType(parentGraphNode.labels[0], graphNode.labels[0])
            if (relDef) {
              const rel = createRelationshipWrapper(parentGraphNode, graphNode, relDef)
              graphRels.push(rel)
            }
          }
        } else {
          createdForElement = ctx.currentGraphNode
        }

        // 2. Update actionCtx with the newly created node
        actionCtx.currentGraphNode = ctx.currentGraphNode

        const processToolRecursive = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
          const toolResult = await executeTool(tool, ctx)

          // Sync tool flags to skipChildrenConfig if modified by tool directly
          if (ctx.skipChildren !== undefined || ctx.skipChildrenTags !== undefined) {
             skipChildrenConfig.skip = skipChildrenConfig.skip || !!ctx.skipChildren
             if (ctx.skipChildrenTags) {
               skipChildrenConfig.tags = [...new Set([...skipChildrenConfig.tags, ...ctx.skipChildrenTags])]
             }
          }

          if (ctx.skipChildrenElements !== undefined) {
            skipChildrenElementsConfig = [...new Set([...(skipChildrenElementsConfig || []), ...ctx.skipChildrenElements])]
          }

          if (ctx.includeChildrenTags !== undefined) {
            includeChildrenTagsConfig = [...new Set([...includeChildrenTagsConfig, ...ctx.includeChildrenTags])]
          }

          if (ctx.childrenRange !== undefined) {
            childrenRangeConfig = ctx.childrenRange
          }

          const toolOutputEdges = toolEdgesBySource.get(tool.id) || []
          const actionOutputEdges = actionEdgesBySource.get(tool.id) || []
          const allOutputEdges = [...toolOutputEdges, ...actionOutputEdges]

          for (const edge of allOutputEdges) {
            const outputPath = toolResult.outputPath || 'output'
            const matches = edge.sourceHandle === outputPath || (!edge.sourceHandle && outputPath === 'output')

            if (matches) {
              // Handle Action Targets
              const actionNode = actionNodes.find(a => a.id === edge.target)
              if (actionNode) {
                executeActionWithWalk(actionNode, actionCtx)
                if (actionCtx.skipped) ctx.skipped = true
                if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
                if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
                if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
                
                if (actionCtx.skipChildren !== undefined) {
                   skipChildrenConfig.skip = skipChildrenConfig.skip || actionCtx.skipChildren
                   if (actionCtx.skipChildrenTags) {
                     skipChildrenConfig.tags = [...new Set([...skipChildrenConfig.tags, ...actionCtx.skipChildrenTags])]
                   }
                }
              }

              // Handle Tool Targets (Recursive)
              const nextTool = toolNodes.find(t => t.id === edge.target)
              if (nextTool) {
                await processToolRecursive(nextTool, ctx)
              }
            }
          }
        }

        // 3. Run Actions connected directly to the Builder Node
        const attachedActions = actionEdgesBySource.get(builderNode.id) || []
        for (const edge of attachedActions) {
          const actionNode = actionNodes.find(a => a.id === edge.target)
          if (actionNode) {
            executeActionWithWalk(actionNode, actionCtx)
            if (actionCtx.skipped) ctx.skipped = true
            if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
            if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
            if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
          }
        }

        // 4. Run Tools connected to the Builder Node
        const attachedTools = toolNodesByTarget.get(builderNode.id) || []
        for (const tool of attachedTools) {
          await processToolRecursive(tool, ctx)
        }

        if (ctx.skipped || elementSkipped) {
          elementSkipped = true
          if (elementToGraph.has(element)) {
            const existingNode = elementToGraph.get(element)!
            const nodeIndex = graphNodes.findIndex(n => n.id === existingNode.id)
            if (nodeIndex !== -1) {
              graphNodes.splice(nodeIndex, 1)
            }
            const relsToRemove: number[] = []
            graphRels.forEach((rel, index) => {
              if (rel.start === existingNode.id || rel.end === existingNode.id) {
                relsToRemove.push(index)
              }
            })
            for (let i = relsToRemove.length - 1; i >= 0; i--) {
              graphRels.splice(relsToRemove[i], 1)
            }
            elementToGraph.delete(element)
          }
          return
        }

        if (ctx.skipMainNode) {
          if (elementToGraph.has(element)) {
            const existingNode = elementToGraph.get(element)!
            const nodeIndex = graphNodes.findIndex(n => n.id === existingNode.id)
            if (nodeIndex !== -1) {
              graphNodes.splice(nodeIndex, 1)
            }
            const relsToRemove: number[] = []
            graphRels.forEach((rel, index) => {
              if (rel.start === existingNode.id || rel.end === existingNode.id) {
                relsToRemove.push(index)
              }
            })
            for (let i = relsToRemove.length - 1; i >= 0; i--) {
              graphRels.splice(relsToRemove[i], 1)
            }
            elementToGraph.delete(element)
            ctx.currentGraphNode = null
            createdForElement = null
          }
        }
      }

      if (elementSkipped) {
        if (elementToGraph.has(element)) {
          const existingNode = elementToGraph.get(element)!
          const nodeIndex = graphNodes.findIndex(n => n.id === existingNode.id)
          if (nodeIndex !== -1) {
            graphNodes.splice(nodeIndex, 1)
          }
          const relsToRemove: number[] = []
          graphRels.forEach((rel, index) => {
            if (rel.start === existingNode.id || rel.end === existingNode.id) {
              relsToRemove.push(index)
            }
          })
          for (let i = relsToRemove.length - 1; i >= 0; i--) {
            graphRels.splice(relsToRemove[i], 1)
          }
          elementToGraph.delete(element)
        }
        return
      }

      let childrenToWalk = element.childNodes ? Array.from(element.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []

      if (skipChildrenElementsConfig && skipChildrenElementsConfig.length > 0) {
        childrenToWalk = childrenToWalk.filter(c => !skipChildrenElementsConfig!.includes(c))
      }

      if (includeChildrenTagsConfig && includeChildrenTagsConfig.length > 0) {
        const tags = includeChildrenTagsConfig
        childrenToWalk = childrenToWalk.filter(c => {
          const tag = c.tagName ? c.tagName.toLowerCase() : ''
          const local = tag.includes(':') ? tag.split(':').pop() || tag : tag
          return tags.includes(tag) || tags.includes(local)
        })
      }

      if (childrenRangeConfig) {
        const { start, end, limit, offset } = childrenRangeConfig
        if (limit !== undefined || offset !== undefined) {
          const startIdx = offset || 0
          const endIdx = limit !== undefined ? startIdx + limit : childrenToWalk.length
          childrenToWalk = childrenToWalk.slice(startIdx, endIdx)
        } else if (start !== undefined || end !== undefined) {
          childrenToWalk = childrenToWalk.slice(start || 0, end !== undefined ? end : childrenToWalk.length)
        }
      }

      if (skipChildrenConfig.skip) {
        if (skipChildrenConfig.tags.length > 0) {
          for (const child of childrenToWalk) {
            const childTag = child.tagName ? child.tagName.toLowerCase() : ''
            const local = childTag.includes(':') ? childTag.split(':').pop() || childTag : childTag
            if (!skipChildrenConfig.tags.includes(childTag) && !skipChildrenConfig.tags.includes(local)) {
              await walk(child as Element, createdForElement || parentGraphNode, depth + 1)
            }
          }
        } else {
          return
        }
      } else {
        for (const child of childrenToWalk) {
          await walk(child as Element, createdForElement || parentGraphNode, depth + 1)
        }
      }
    } catch (error) {
      throw error
    }
  }

  let startElement: Element = root
  if (startNodeId) {
    const startNode = nodeIdToNode.get(startNodeId)
    if (startNode) {
      const startTag = startNode.label.toLowerCase()
      const found = findElementByTag(doc, startTag)
      if (found) {
        startElement = found
      }
    }
  }

  await walk(startElement, null, 0)

  const nodesToRemove = new Set<number>()

  // Process deferred relationships
  deferredRelationships.forEach(deferred => {
    let targetNodes: GraphJsonNode[] = []

    if (deferred.targetElement) {
      const node = elementToGraph.get(deferred.targetElement)
      if (node) targetNodes.push(node)
    }

    if (deferred.targetId) {
      const idMatches = graphNodes.filter(n =>
        String(n.properties['xml:id'] || '') === deferred.targetId ||
        String(n.properties['id'] || '') === deferred.targetId ||
        String(n.properties['_id'] || '') === deferred.targetId ||
        String(n.properties['uri'] || '') === deferred.targetId
      )
      idMatches.forEach(n => {
        if (!targetNodes.find(tn => tn.id === n.id)) {
          targetNodes.push(n)
        }
      })
    } else if (deferred.targetLookup) {
      const { label, propertyKey, propertyValue } = deferred.targetLookup
      const hasLabel = label && label.trim() !== ''
      const hasProperty = propertyKey && propertyKey.trim() !== ''

      // Safety: If property lookup is requested but the value evaluates to empty, the lookup is invalid.
      // Do not randomly match nodes that have an empty/missing property.
      if (hasProperty && (!propertyValue || String(propertyValue).trim() === '')) {
        if (deferred.mustResolve || deferred.targetLookup) {
          nodesToRemove.add(deferred.from.id)
        }
        return
      }

      if (hasLabel || hasProperty) {
        const matches = graphNodes.filter(n => {
          const labelMatch = !hasLabel || n.labels.some(l => l.toLowerCase() === label.toLowerCase())
          let propertyMatch = false
          
          if (hasProperty) {
            const nodePropVal = n.properties[propertyKey]
            if (nodePropVal !== undefined && String(nodePropVal) === String(propertyValue)) {
              propertyMatch = true
            } else if (propertyKey === 'id' || propertyKey === 'xml:id') {
              // Permissive ID check
              propertyMatch = String(n.properties['xml:id'] || '') === String(propertyValue) ||
                              String(n.properties['id'] || '') === String(propertyValue) ||
                              String(n.properties['_id'] || '') === String(propertyValue) ||
                              String(n.properties['uri'] || '') === String(propertyValue)
            }
          } else {
            propertyMatch = true // No property requirement if we only check label
          }
          
          return labelMatch && propertyMatch
        })
        matches.forEach(n => {
          if (!targetNodes.find(tn => tn.id === n.id)) {
            targetNodes.push(n)
          }
        })
      }
    }

    if (targetNodes.length > 0) {
      targetNodes.forEach(targetNode => {
        const startNode = deferred.direction === 'incoming' ? targetNode : deferred.from
        const endNode = deferred.direction === 'incoming' ? deferred.from : targetNode
        
        const rel = createRelationshipWrapper(startNode, endNode, { type: deferred.type } as Relationship, deferred.properties)
        graphRels.push(rel)
      })
    } else if (deferred.mustResolve || deferred.targetLookup) {
      // For create-node-with-lookup (targetLookup), we ALWAYS discard if lookup fails
      nodesToRemove.add(deferred.from.id)
    }
  })

  deferredOperations.forEach(op => {
    const { type, contextNode, parentNode, config, apiData } = op
    const resolveNodes = (alias: string, lookup: any): GraphJsonNode[] => {
      if (alias === 'current') return contextNode ? [contextNode] : []
      if (alias === 'parent') return parentNode ? [parentNode] : []
      if (alias === 'lookup' && lookup) {
        const label = evaluateTemplate(lookup.label || '', apiData)
        const propertyKey = evaluateTemplate(lookup.propertyKey || '', apiData)
        const propertyValue = evaluateTemplate(lookup.propertyValue || '', apiData)
        
        const hasLabel = label && label.trim() !== ''
        const hasProperty = propertyKey && propertyKey.trim() !== ''
        
        return graphNodes.filter(n => {
          const labelMatch = !hasLabel || n.labels.some(l => l.toLowerCase() === label.toLowerCase())
          let propertyMatch = false
          if (hasProperty) {
            const nodePropVal = n.properties[propertyKey]
            if (nodePropVal !== undefined && String(nodePropVal) === String(propertyValue)) {
              propertyMatch = true
            } else if (propertyKey === 'id' || propertyKey === 'xml:id') {
              propertyMatch = String(n.properties['xml:id'] || '') === String(propertyValue) ||
                              String(n.properties['id'] || '') === String(propertyValue) ||
                              String(n.properties['_id'] || '') === String(propertyValue) ||
                              String(n.properties['uri'] || '') === String(propertyValue)
            }
          } else {
            propertyMatch = true
          }
          return labelMatch && propertyMatch
        })
      }
      return []
    }

    if (type === 'update-relationship' || type === 'delete-relationship' || type === 'reverse-relationship') {
      const fromNodes = resolveNodes(config.fromAlias || 'current', config.fromLookup)
      const toNodes = resolveNodes(config.toAlias || 'parent', config.toLookup)
      const relTypeLabel = evaluateTemplate(config.relationshipType || '', apiData)

      if (fromNodes.length === 0 || toNodes.length === 0) return

      const fromNodeIds = new Set(fromNodes.map(n => n.id))
      const toNodeIds = new Set(toNodes.map(n => n.id))

      const matchingRels = graphRels.filter(rel => {
        const labelMatch = !relTypeLabel || rel.label.toLowerCase() === relTypeLabel.toLowerCase()
        const nodesMatch = fromNodeIds.has(rel.start) && toNodeIds.has(rel.end)
        return labelMatch && nodesMatch
      })

      if (type === 'delete-relationship') {
        const propertyMatch = config.propertyMatch as Array<{ key: string, value: string }> || []
        matchingRels.forEach(rel => {
          let allPropsMatch = true
          propertyMatch.forEach(pm => {
            if (String(rel.properties[pm.key] || '') !== String(evaluateTemplate(pm.value, apiData))) {
              allPropsMatch = false
            }
          })
          if (allPropsMatch) {
            const idx = graphRels.findIndex(r => r.id === rel.id)
            if (idx > -1) graphRels.splice(idx, 1)
          }
        })
      } else if (type === 'update-relationship') {
        const properties = config.properties as Array<{ key: string, value: string }> || []
        const newLabel = evaluateTemplate(config.newRelationshipType || '', apiData)
        matchingRels.forEach(rel => {
          if (newLabel) rel.label = newLabel
          properties.forEach(p => {
            rel.properties[p.key] = evaluateTemplate(p.value, apiData)
          })
        })
      } else if (type === 'reverse-relationship') {
        matchingRels.forEach(rel => {
          const temp = rel.start
          rel.start = rel.end
          rel.end = temp
        })
      }
    } else {
      // Node operations
      const targetNodes = resolveNodes(config.targetAlias || 'current', config.targetLookup)
      if (targetNodes.length === 0) return

      if (type === 'update-node') {
        const properties = config.properties as Array<{ key: string, value: string }> || []
        const labels = config.labels as string[] || []

        targetNodes.forEach(node => {
          properties.forEach(({ key, value }) => {
            node.properties[key] = evaluateTemplate(value, apiData)
          })
          if (labels.length > 0) {
            node.labels = labels.map(l => evaluateTemplate(l, apiData))
          }
        })
      } else if (type === 'delete-node') {
        const condition = config.condition as any || {}
        const propertyMatch = condition.propertyMatch as Array<{ key: string, value: string }> || []

        targetNodes.forEach(node => {
          let shouldDelete = true
          propertyMatch.forEach(({ key, value }) => {
            if (String(node.properties[key] || '') !== String(evaluateTemplate(value, apiData))) {
              shouldDelete = false
            }
          })
          if (shouldDelete) {
            nodesToRemove.add(node.id)
          }
        })
      } else if (type === 'clone-node') {
        const modifications = config.modifications as Array<{ key: string, value: string }> || []
        const newLabels = config.newLabels as string[] || []

        targetNodes.forEach(node => {
          const clonedNode: GraphJsonNode = {
            id: nodeIdCounter.value++,
            type: 'node',
            labels: newLabels.length > 0 ? newLabels.map(l => evaluateTemplate(l, apiData)) : [...node.labels],
            properties: { ...node.properties }
          }
          modifications.forEach(({ key, value }) => {
            clonedNode.properties[key] = evaluateTemplate(value, apiData)
          })
          graphNodes.push(clonedNode)

          if (config.relationshipType) {
            const relTypeLabel = evaluateTemplate(config.relationshipType, apiData)
            const direction = config.relationshipDirection || 'outgoing'
            const relTargetAlias = config.relationshipTargetAlias || 'original'
            
            let relTargetNodes: GraphJsonNode[] = []
            if (relTargetAlias === 'original') {
              relTargetNodes = [node]
            } else {
              relTargetNodes = resolveNodes(relTargetAlias, config.relationshipTargetLookup)
            }

            if (relTargetNodes.length > 0 && relTypeLabel) {
              relTargetNodes.forEach(rn => {
                const startNode = direction === 'incoming' ? rn : clonedNode
                const endNode = direction === 'incoming' ? clonedNode : rn
                graphRels.push({
                  id: relIdCounter.value++,
                  type: 'relationship',
                  label: relTypeLabel,
                  start: startNode.id,
                  end: endNode.id,
                  properties: {}
                })
              })
            }
          }
        })
      } else if (type === 'merge-nodes') {
        // Merge targetNodes into a single node or merge another set into targetNodes
        const mergeStrategy = config.mergeStrategy || 'union'
        const sourceNodes = resolveNodes(config.sourceAlias || 'parent', config.sourceLookup)
        
        if (sourceNodes.length === 0) return

        targetNodes.forEach(target => {
          sourceNodes.forEach(source => {
            if (source.id === target.id) return
            
            if (mergeStrategy === 'union') {
              target.labels = Array.from(new Set([...target.labels, ...source.labels]))
              target.properties = { ...target.properties, ...source.properties }
            } else if (mergeStrategy === 'preferSource') {
              target.properties = { ...target.properties, ...source.properties }
            } else {
              // preferTarget: already correct as source props don't overwrite
              target.properties = { ...source.properties, ...target.properties }
            }

            // Move relationships
            graphRels.forEach(rel => {
              if (rel.start === source.id) rel.start = target.id
              if (rel.end === source.id) rel.end = target.id
            })

            nodesToRemove.add(source.id)
          })
        })
      }
    }
  })

  // Final cleanup if any nodes failed strict lookup
  let finalNodes = graphNodes
  let finalRels = graphRels
  const expandedNodesToRemove = new Set<number>(nodesToRemove)

  if (nodesToRemove.size > 0) {
    // Recursive expansion: remove anything that was 'contained' by a removed node
    let changed = true
    while (changed) {
      changed = false
      graphRels.forEach(rel => {
        if (expandedNodesToRemove.has(rel.start) && !expandedNodesToRemove.has(rel.end)) {
          expandedNodesToRemove.add(rel.end)
          changed = true
        }
      })
    }

  }

  // Use the (potentially expanded) graphNodes as the base for final result
  finalNodes = graphNodes.filter(n => !expandedNodesToRemove.has(n.id))
  finalRels = graphRels.filter(r => !expandedNodesToRemove.has(r.start) && !expandedNodesToRemove.has(r.end))

  return [...finalNodes, ...finalRels]
}

export type { GraphJson, GraphJsonNode, GraphJsonRelationship, ExecuteOptions } from './types'
