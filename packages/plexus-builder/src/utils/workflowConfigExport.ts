import type { Node, Relationship, Property } from '../types'
import type { ToolCanvasNode, ToolCanvasEdge } from '../stores/toolCanvasStore'
import type { ActionCanvasNode, ActionCanvasEdge } from '../stores/actionCanvasStore'

export interface WorkflowConfigExport {
  version: number
  type: 'workflow-config'
  createdAt: string
  metadata?: {
    name?: string
    description?: string
  }
  rootNodeLabel?: string | null
  relationships?: Array<{
    fromNodeLabel: string
    toNodeLabel: string
    type: string
    properties?: Array<{
      key: string
      type: string
      required: boolean
      defaultValue?: unknown
    }>
    cardinality?: string
  }>
  tools: Array<{
    type: string
    label: string
    targetNodeLabel: string
    targetNodeSemantic?: any
    config: Record<string, unknown>
    position: { x: number; y: number }
    inputs?: number
    outputs?: Array<{ id: string; label: string }>
  }>
  toolEdges: Array<{
    sourceNodeLabel?: string
    sourceToolLabel?: string
    targetToolLabel?: string
    targetActionLabel?: string
    sourceHandle?: string
    targetHandle?: string
  }>
  actions: Array<{
    type: string
    label: string
    config: Record<string, unknown>
    position: { x: number; y: number }
    isGroup?: boolean
    children?: Array<{
      type: string
      label: string
      config: Record<string, unknown>
      position: { x: number; y: number }
    }>
    isExpanded?: boolean
    enabled?: boolean
  }>
  actionEdges: Array<{
    sourceToolLabel?: string
    sourceActionLabel?: string
    targetActionLabel: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

export function exportWorkflowConfig(
  nodes: Node[],
  relationships: Relationship[],
  toolNodes: ToolCanvasNode[],
  toolEdges: ToolCanvasEdge[],
  actionNodes: ActionCanvasNode[],
  actionEdges: ActionCanvasEdge[],
  rootNodeId: string | null
): string {
  const rootNode = nodes.find(n => n.id === rootNodeId)
  const toolIdToNode = new Map(toolNodes.map(t => [t.id, t]))
  const actionIdToNode = new Map(actionNodes.map(a => [a.id, a]))

  // Build tool label map (using target node label + tool type as identifier)
  const toolLabelMap = new Map<string, string>()
  toolNodes.forEach(tool => {
    const targetNode = nodes.find(n => n.id === tool.targetNodeId)
    if (targetNode) {
      const toolLabel = `${targetNode.label}::${tool.type}`
      toolLabelMap.set(tool.id, toolLabel)
    }
  })

  const config: WorkflowConfigExport = {
    version: 1,
    type: 'workflow-config',
    createdAt: new Date().toISOString(),
    metadata: {
      // Exclude metadata name/desc as they are usually handled by the persistence layer
    },
    rootNodeLabel: rootNode?.label || null,
    // Exclude relationships from workflow export as per requirement to separate schema and workflow
    relationships: [], 

    tools: toolNodes.map(tool => {
      const targetNode = nodes.find(n => n.id === tool.targetNodeId)
      return {
        type: tool.type,
        label: tool.label,
        targetNodeLabel: targetNode?.label || '',
        ...(targetNode && (targetNode.data as any)?.semantic ? { targetNodeSemantic: (targetNode.data as any).semantic } : {}),
        config: tool.config,
        position: tool.position,
        inputs: tool.inputs,
        outputs: tool.outputs
      }
    }),
    toolEdges: toolEdges.map(edge => {
      const sourceTool = toolIdToNode.get(edge.source)
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetTool = toolIdToNode.get(edge.target)
      const targetAction = actionIdToNode.get(edge.target)

      // Check if source is a node (when connecting node to tool)
      if (sourceNode && edge.sourceHandle === 'tools') {
        // Source is a node, not a tool
        if (targetTool) {
          const targetTargetNode = targetTool.targetNodeId
            ? nodes.find(n => n.id === targetTool.targetNodeId)
            : null
          const targetToolLabel = targetTargetNode
            ? `${targetTargetNode.label}::${targetTool.type}`
            : targetTool.label || ''
          return {
            sourceNodeLabel: sourceNode.label,
            targetToolLabel,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }
        } else if (targetAction) {
          return {
            sourceNodeLabel: sourceNode.label,
            targetActionLabel: targetAction.label,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }
        }
      } else if (sourceTool) {
        // Source is a tool
        const sourceTargetNode = sourceTool.targetNodeId
          ? nodes.find(n => n.id === sourceTool.targetNodeId)
          : null
        const toolLabel = sourceTargetNode
          ? `${sourceTargetNode.label}::${sourceTool.type}`
          : sourceTool.label || ''

        if (targetTool) {
          const targetTargetNode = targetTool.targetNodeId
            ? nodes.find(n => n.id === targetTool.targetNodeId)
            : null
          const targetToolLabel = targetTargetNode
            ? `${targetTargetNode.label}::${targetTool.type}`
            : targetTool.label || ''

          return {
            sourceToolLabel: toolLabel,
            targetToolLabel,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }
        } else if (targetAction) {
          return {
            sourceToolLabel: toolLabel,
            targetActionLabel: targetAction.label,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }
        }
      }
      return null
    }).filter((edge): edge is NonNullable<typeof edge> => edge !== null),
    actions: actionNodes
      .filter(action => {
        // Don't export child actions as separate actions - they should only exist in their parent group's children array
        const isChild = actionNodes.some(group =>
          group.isGroup && group.children && group.children.includes(action.id)
        )
        return !isChild
      })
      .map(action => {
        // For action groups, export children as full action objects (not just labels) so they can be recreated
        const childrenActions = action.isGroup && action.children
          ? action.children.map(childId => {
            const childAction = actionNodes.find(a => a.id === childId)
            if (!childAction) return null
            return {
              type: childAction.type,
              label: childAction.label,
              config: childAction.config,
              position: childAction.position || { x: 0, y: 0 }
            }
          }).filter((child): child is NonNullable<typeof child> => child !== null)
          : undefined

        return {
          type: action.type,
          label: action.label,
          config: action.config,
          position: action.position,
          isGroup: action.isGroup,
          children: childrenActions, // Export as full action objects for import
          isExpanded: action.isExpanded,
          enabled: action.enabled
        }
      }),
    actionEdges: actionEdges.map(edge => {
      const sourceTool = toolIdToNode.get(edge.source)
      const sourceAction = actionIdToNode.get(edge.source)
      const targetAction = actionIdToNode.get(edge.target)

      let sourceToolLabel = ''
      let sourceActionLabel = ''

      if (sourceTool) {
        const sourceTargetNode = sourceTool.targetNodeId
          ? nodes.find(n => n.id === sourceTool.targetNodeId)
          : null
        sourceToolLabel = sourceTargetNode
          ? `${sourceTargetNode.label}::${sourceTool.type}`
          : sourceTool.label || ''
      } else if (sourceAction) {
        sourceActionLabel = sourceAction.label
      }

      return {
        sourceToolLabel: sourceToolLabel || undefined,
        sourceActionLabel: sourceActionLabel || undefined,
        targetActionLabel: targetAction?.label || '',
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }
    }).filter(edge => (edge.sourceToolLabel || edge.sourceActionLabel) && edge.targetActionLabel)
  }

  return JSON.stringify(config, null, 2)
}

export interface ImportedWorkflowConfig {
  relationships: Array<Omit<Relationship, 'id'>>
  tools: Array<Omit<ToolCanvasNode, 'id'>>
  toolEdges: Array<{
    sourceNodeLabel?: string
    sourceToolLabel?: string
    targetToolLabel?: string
    targetActionLabel?: string
    sourceHandle?: string
    targetHandle?: string
  }>
  actions: Array<Omit<ActionCanvasNode, 'id'> & { _childActions?: Array<Omit<ActionCanvasNode, 'id'>> }>
  actionEdges: Array<{
    sourceToolLabel?: string
    sourceActionLabel?: string
    targetActionLabel: string
    sourceHandle?: string
    targetHandle?: string
  }>
  _originalCounts?: {
    relationships: number
    tools: number
    actions: number
    toolEdges: number
    actionEdges: number
  }
  rootNodeId?: string | null
}

export function importWorkflowConfig(
  jsonString: string,
  nodes: Node[]
): ImportedWorkflowConfig {
  let config: any;
  
  try {
    config = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse workflow config file. The file appears to be invalid JSON. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Basic structure validation
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid workflow config file format. Expected a JSON object.');
  }

  // Check for required type property and handle wrapped format
  if (!config.type) {
    const availableKeys = Object.keys(config).join(', ');
    
    // Check if this is a wrapped format where the actual config is in a 'config' property
    if (config.config && typeof config.config === 'object' && config.config.type) {
      console.log('Detected wrapped workflow config format, extracting inner config');
      config = config.config;
    } else if (availableKeys.includes('version') || availableKeys.includes('tools') || availableKeys.includes('actions')) {
      throw new Error(`This appears to be an older workflow config format (missing 'type' property). Available properties: ${availableKeys}. Please export a new workflow config from the current system to get the correct format.`);
    } else {
      throw new Error(`Invalid workflow config file: missing 'type' property. Available properties: ${availableKeys}. This file may be an older format or a different type of configuration file.`);
    }
  }

  const workflowConfig: WorkflowConfigExport = config;

  if (workflowConfig.type !== 'workflow-config') {
    throw new Error(`Invalid workflow config file type. Expected 'workflow-config', but got '${workflowConfig.type}'. Please ensure you're importing a valid workflow configuration file.`);
  }

  // Build node label to ID map
  const nodeLabelToId = new Map(nodes.map(n => [n.label, n.id]))

  // Import relationships - preserve node labels for error reporting
  const relationships: Array<Omit<Relationship, 'id'> & { fromNodeLabel?: string; toNodeLabel?: string }> = (workflowConfig.relationships || [])
    .map(rel => {
      const fromId = nodeLabelToId.get(rel.fromNodeLabel)
      const toId = nodeLabelToId.get(rel.toNodeLabel)
      if (!fromId || !toId) {
        return {
          type: rel.type,
          from: rel.fromNodeLabel, // Keep label for error reporting
          to: rel.toNodeLabel, // Keep label for error reporting
          fromNodeLabel: rel.fromNodeLabel,
          toNodeLabel: rel.toNodeLabel,
          properties: rel.properties?.map(prop => ({
            key: prop.key,
            type: prop.type as Property['type'],
            required: prop.required,
            defaultValue: prop.defaultValue,
            description: undefined
          })),
          cardinality: rel.cardinality as Relationship['cardinality']
        } as any
      }
      return {
        type: rel.type,
        from: fromId,
        to: toId,
        fromNodeLabel: rel.fromNodeLabel,
        toNodeLabel: rel.toNodeLabel,
        properties: rel.properties?.map(prop => ({
          key: prop.key,
          type: prop.type as Property['type'],
          required: prop.required,
          defaultValue: prop.defaultValue,
          description: undefined
        })),
        cardinality: rel.cardinality as Relationship['cardinality']
      }
    })

  // Import tools
  const toolLabelToId = new Map<string, string>()
  const tools = (workflowConfig.tools || []).map(tool => {
    const targetNodeId = tool.targetNodeLabel 
      ? nodeLabelToId.get(tool.targetNodeLabel)
      : undefined
      
    const toolId = `temp_${Math.random().toString(36).slice(2, 9)}`
    // For tools without target node, use just label or type as key part
    const toolLabel = targetNodeId && tool.targetNodeLabel
      ? `${tool.targetNodeLabel}::${tool.type}`
      : tool.label || tool.type
      
    toolLabelToId.set(toolLabel, toolId)
    return {
      type: tool.type as ToolCanvasNode['type'],
      label: tool.label,
      targetNodeId,
      config: tool.config,
      position: tool.position,
      inputs: tool.inputs,
      outputs: tool.outputs
    }
  })
    .filter((tool): tool is NonNullable<typeof tool> => tool !== null)

  // Import actions - first pass: create all top-level actions (not children) and build label-to-id map
  const actionLabelToId = new Map<string, string>()
  const actions: Array<Omit<ActionCanvasNode, 'id' | 'children'> & { children?: any }> = workflowConfig.actions
    .map(action => {
      const actionId = `temp_${Math.random().toString(36).slice(2, 9)}`
      actionLabelToId.set(action.label, actionId)
      return {
        type: action.type as ActionCanvasNode['type'],
        label: action.label,
        config: action.config,
        position: action.position,
        isGroup: action.isGroup,
        isExpanded: action.isExpanded,
        enabled: action.enabled,
        children: action.children // Children are now full action objects, will be processed in second pass
      }
    })

  // Second pass: create child actions and remap children IDs
  const actionsWithRemappedChildren = actions.map(action => {
    if (action.isGroup && action.children && Array.isArray(action.children) && action.children.length > 0) {
      // Children are now full action objects, not just labels
      // Create temp IDs for each child and add them to the label-to-id map
      const remappedChildren = action.children.map((childAction: any) => {
        const childId = `temp_${Math.random().toString(36).slice(2, 9)}`
        // Store child ID by label for potential edge matching
        actionLabelToId.set(childAction.label, childId)
        return childId
      })

      // Create child action objects to be added separately
      const childActions = action.children.map((childAction: any) => ({
        type: childAction.type as ActionCanvasNode['type'],
        label: childAction.label,
        config: childAction.config,
        position: childAction.position || { x: 0, y: 0 },
        isGroup: false,
        isExpanded: false,
        enabled: true
      }))

        // Store child actions for later addition (we'll add them after groups are created)
        ; (action as any)._childActions = childActions

      return {
        ...action,
        children: remappedChildren
      }
    }
    return action
  })

  // Import tool edges - return with labels for matching during import
  const toolEdges = workflowConfig.toolEdges.map(edge => ({
    sourceToolLabel: edge.sourceToolLabel,
    targetToolLabel: edge.targetToolLabel,
    targetActionLabel: edge.targetActionLabel,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }))

  // Import action edges - return with labels for matching during import
  const actionEdges = workflowConfig.actionEdges.map(edge => ({
    sourceToolLabel: edge.sourceToolLabel,
    sourceActionLabel: edge.sourceActionLabel,
    targetActionLabel: edge.targetActionLabel,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }))

  return {
    relationships,
    tools,
    toolEdges,
    actions: actionsWithRemappedChildren,
    actionEdges,
    rootNodeId: workflowConfig.rootNodeLabel ? nodeLabelToId.get(workflowConfig.rootNodeLabel) || null : null,
    _originalCounts: {
      relationships: workflowConfig.relationships?.length || 0,
      tools: workflowConfig.tools.length,
      actions: workflowConfig.actions.length,
      toolEdges: workflowConfig.toolEdges.length,
      actionEdges: workflowConfig.actionEdges.length
    }
  }
}

