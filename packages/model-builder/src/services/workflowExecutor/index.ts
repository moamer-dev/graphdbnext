import { DOMParser } from '@xmldom/xmldom'
import type { Node as BuilderNode, Relationship } from '../../types'
import type { ToolCanvasNode, ToolCanvasEdge } from '../../stores/toolCanvasStore'
import type { ActionCanvasNode, ActionCanvasEdge } from '../../stores/actionCanvasStore'
import type { GraphJson, GraphJsonNode, GraphJsonRelationship, ExecuteOptions, ExecutionContext } from './types'

import { executeTool } from './tools'
import { executeActionWithWalk, type SpecialActionExecutionContext } from './actions'
import { createGraphNode, createRelationship } from './helpers/graphHelpers'
import { createGetApiResponseData } from './helpers/apiHelpers'
import { evaluateTemplate } from './helpers/templateHelpers'
import { applyTransforms } from './helpers/transformHelpers'
import { findElementById, buildLabelMap, findElementByTag } from './helpers/elementHelpers'

export function executeWorkflow(options: ExecuteOptions): GraphJson {
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
    to: GraphJsonNode | null // If null, implies looking up by ID in properties? No, wait.
    // We need enough info to resolve target.
    // Usually deferred means "Target Element is known, but GraphNode not yet created" OR "Target ID string known".
    // ReferenceActions needs to store lookup info.
    type: string
    properties: Record<string, unknown>
    targetId?: string // Added for ID lookup
    targetElement?: Element // Added for Element lookup
  }> = []

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
    id: number
  ): GraphJsonNode => {
    return createGraphNode(builderNode as BuilderNode, element, id, schemaJson)
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

  const walk = (element: Element, parentGraphNode: GraphJsonNode | null, depth: number = 0) => {
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
        children.forEach((child) => {
          walk(child as Element, parentGraphNode, depth + 1)
        })
        return
      }

      let createdForElement: GraphJsonNode | null = null
      let elementSkipped = false
      let skipChildrenConfig: { skip: boolean; tags?: string[] } | null = null as { skip: boolean; tags?: string[] } | null

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

      matchedNodes.forEach((builderNode) => {
        if (elementSkipped) {
          return
        }

        const ctx: ExecutionContext = {
          xmlElement: element,
          parentGraphNode,
          currentGraphNode: null,
          builderNode,
          elementToGraph,
          deferredRelationships,
          skipped: false,
          findRelationship: findRelType
        }

        const attachedTools = toolNodesByTarget.get(builderNode.id) || []

        attachedTools.forEach(tool => {
          const toolResult = executeTool(tool, ctx)

          const toolOutputEdges = toolEdgesBySource.get(tool.id) || []

          toolOutputEdges.forEach(edge => {
            const outputPath = toolResult.outputPath || 'output'
            const matches = edge.sourceHandle === outputPath || (!edge.sourceHandle && outputPath === 'output')
            if (matches) {
              const actionNode = actionNodes.find(a => a.id === edge.target)
              if (actionNode) {
                const actionCtx: SpecialActionExecutionContext = {
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
                  evaluateTemplate,
                  applyTransforms: applyTransformsWrapper,
                  findElementById,
                  walk,
                  labelToNodes,
                  actionNodes
                }
                executeActionWithWalk(actionNode, actionCtx)
                if (actionCtx.skipped) ctx.skipped = true
                if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
                if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
                if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
                if (ctx.skipChildren !== undefined) {
                  if (skipChildrenConfig === null) {
                    skipChildrenConfig = {
                      skip: ctx.skipChildren,
                      tags: ctx.skipChildrenTags || []
                    }
                  } else {
                    skipChildrenConfig = {
                      skip: skipChildrenConfig.skip || ctx.skipChildren,
                      tags: [...new Set([...(skipChildrenConfig.tags || []), ...(ctx.skipChildrenTags || [])])]
                    }
                  }
                }
              }
            }
          })

          const actionOutputEdges = actionEdgesBySource.get(tool.id) || []
          actionOutputEdges.forEach(edge => {
            const outputPath = toolResult.outputPath || 'output'
            const matches = edge.sourceHandle === outputPath || (!edge.sourceHandle && outputPath === 'output')
            if (matches) {
              const actionNode = actionNodes.find(a => a.id === edge.target)
              if (actionNode) {
                const actionCtx: SpecialActionExecutionContext = {
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
                  evaluateTemplate,
                  applyTransforms: applyTransformsWrapper,
                  findElementById,
                  walk,
                  labelToNodes,
                  actionNodes
                }
                executeActionWithWalk(actionNode, actionCtx)
                if (actionCtx.skipped) ctx.skipped = true
                if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
                if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
                if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
                if (ctx.skipChildren !== undefined) {
                  if (skipChildrenConfig === null) {
                    skipChildrenConfig = {
                      skip: ctx.skipChildren,
                      tags: ctx.skipChildrenTags || []
                    }
                  } else {
                    skipChildrenConfig = {
                      skip: skipChildrenConfig.skip || ctx.skipChildren,
                      tags: [...new Set([...(skipChildrenConfig.tags || []), ...(ctx.skipChildrenTags || [])])]
                    }
                  }
                }
              }
            }
          })

          toolOutputEdges.forEach(edge => {
            const nextTool = toolNodes.find(t => t.id === edge.target)
            if (nextTool) {
              executeTool(nextTool, ctx)
              const nextToolEdges = toolEdgesBySource.get(nextTool.id) || []
              nextToolEdges.forEach(nextEdge => {
                const actionNode = actionNodes.find(a => a.id === nextEdge.target)
                if (actionNode) {
                  const actionCtx: SpecialActionExecutionContext = {
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
                    evaluateTemplate,
                    applyTransforms: applyTransformsWrapper,
                    findElementById,
                    walk,
                    labelToNodes,
                    actionNodes
                  }
                  executeActionWithWalk(actionNode, actionCtx)
                  if (actionCtx.skipped) ctx.skipped = true
                  if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
                  if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
                  if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
                  if (ctx.skipChildren !== undefined) {
                    if (skipChildrenConfig === null) {
                      skipChildrenConfig = {
                        skip: ctx.skipChildren,
                        tags: ctx.skipChildrenTags || []
                      }
                    } else {
                      skipChildrenConfig = {
                        skip: skipChildrenConfig.skip || ctx.skipChildren,
                        tags: [...new Set([...(skipChildrenConfig.tags || []), ...(ctx.skipChildrenTags || [])])]
                      }
                    }
                  }
                }
              })
              const nextActionEdges = actionEdgesBySource.get(nextTool.id) || []
              nextActionEdges.forEach(nextEdge => {
                const actionNode = actionNodes.find(a => a.id === nextEdge.target)
                if (actionNode) {
                  const actionCtx: SpecialActionExecutionContext = {
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
                    evaluateTemplate,
                    applyTransforms: applyTransformsWrapper,
                    findElementById,
                    walk,
                    labelToNodes,
                    actionNodes
                  }
                  executeActionWithWalk(actionNode, actionCtx)
                  if (actionCtx.skipped) ctx.skipped = true
                  if (actionCtx.skipMainNode !== undefined) ctx.skipMainNode = actionCtx.skipMainNode
                  if (actionCtx.skipChildren !== undefined) ctx.skipChildren = actionCtx.skipChildren
                  if (actionCtx.skipChildrenTags !== undefined) ctx.skipChildrenTags = actionCtx.skipChildrenTags
                  if (ctx.skipChildren !== undefined) {
                    if (skipChildrenConfig === null) {
                      skipChildrenConfig = {
                        skip: ctx.skipChildren,
                        tags: ctx.skipChildrenTags || []
                      }
                    } else {
                      skipChildrenConfig = {
                        skip: skipChildrenConfig.skip || ctx.skipChildren,
                        tags: [...new Set([...(skipChildrenConfig.tags || []), ...(ctx.skipChildrenTags || [])])]
                      }
                    }
                  }
                }
              })
            }
          })
        })

        if (ctx.skipMainNode !== undefined || ctx.skipChildren !== undefined) {
          if (ctx.skipMainNode) {
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
            if (ctx.skipMainNode) {
              return
            }
          }

          if (ctx.skipChildren !== undefined) {
            if (skipChildrenConfig === null) {
              skipChildrenConfig = {
                skip: ctx.skipChildren,
                tags: ctx.skipChildrenTags || []
              }
            } else {
              skipChildrenConfig = {
                skip: skipChildrenConfig.skip || ctx.skipChildren,
                tags: [...new Set([...(skipChildrenConfig.tags || []), ...(ctx.skipChildrenTags || [])])]
              }
            }
          }
        }

        if (ctx.skipped) {
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

        if (attachedTools.length === 0 && ctx.currentGraphNode === null) {
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
        } else if (ctx.currentGraphNode) {
          createdForElement = ctx.currentGraphNode
        } else if (attachedTools.length > 0 && ctx.currentGraphNode === null && !ctx.skipped) {
          // Check if a node was already created for this element (e.g., by an action in a sub-context)
          const existingNode = elementToGraph.get(element)

          if (existingNode && existingNode.labels.includes(builderNode.label)) {
            // Reuse the existing node created by the action
            createdForElement = existingNode
            ctx.currentGraphNode = existingNode
          } else {
            // No node created by action, create one now
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
          }
        }
      })

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

      const children = element.childNodes ? Array.from(element.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []

      if (skipChildrenConfig !== null && skipChildrenConfig.skip) {
        const config = skipChildrenConfig
        if (config.tags && config.tags.length > 0) {
          children.forEach((child) => {
            const childTag = child.tagName ? child.tagName.toLowerCase() : ''
            if (!config.tags!.includes(childTag)) {
              walk(child as Element, createdForElement || parentGraphNode, depth + 1)
            }
          })
        } else {
          return
        }
      } else {
        children.forEach((child) => {
          walk(child as Element, createdForElement || parentGraphNode, depth + 1)
        })
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

  walk(startElement, null, 0)

  // Process deferred relationships
  deferredRelationships.forEach(deferred => {
    let targetNode: GraphJsonNode | undefined

    if (deferred.targetElement) {
      targetNode = elementToGraph.get(deferred.targetElement)
    } else if (deferred.targetId) {
      // Linear scan? Or build a map of IDs?
      // elementToGraph has Element keys. We need ID -> Node.
      // We can iterate graphNodes and check properties.
      // Or rely on ID map if graphNodes have IDs?
      // Assuming 'props.id' or 'props.xml:id' holds the ID.
      targetNode = graphNodes.find(n =>
        n.properties['xml:id'] === deferred.targetId ||
        n.properties['id'] === deferred.targetId
      )
    }

    if (targetNode) {
      const rel = createRelationshipWrapper(deferred.from, targetNode, { type: deferred.type } as Relationship, deferred.properties)
      graphRels.push(rel)
    }
  })

  return [...graphNodes, ...graphRels]
}

export type { GraphJson, GraphJsonNode, GraphJsonRelationship, ExecuteOptions } from './types'
