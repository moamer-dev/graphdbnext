import { exportWorkflowConfig, WorkflowConfigExport, ImportedWorkflowConfig } from '../../utils/workflowConfigExport'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { Node, Relationship } from '../../types'

/**
 * Service to handle workflow operations like importing and remapping.
 */
export const workflowService = {
  /**
   * Gets the current workflow configuration from the stores.
   */
  getCurrentWorkflowConfig: (): WorkflowConfigExport | null => {
    try {
      const state = useModelBuilderStore.getState()
      const toolState = useToolCanvasStore.getState()
      const actionState = useActionCanvasStore.getState()

      const configJson = exportWorkflowConfig(
        state.nodes,
        state.relationships,
        toolState.nodes,
        toolState.edges,
        actionState.nodes,
        actionState.edges,
        state.rootNodeId
      )
      return JSON.parse(configJson) as WorkflowConfigExport
    } catch (error) {
      console.error('Error exporting workflow config:', error)
      return null
    }
  },

  /**
   * Applies an imported workflow config to the stores.
   */
  applyWorkflowConfig: (config: ImportedWorkflowConfig, nodes: Node[]) => {
    const { addRelationship } = useModelBuilderStore.getState()
    const { addNode: addToolNode, addEdge: addToolEdge, nodes: existingToolNodes } = useToolCanvasStore.getState()
    const { addNode: addActionNode, addEdge: addActionEdge, updateNode: updateActionNode, nodes: actionNodesStore } = useActionCanvasStore.getState()
    const { setRootNodeId } = useModelBuilderStore.getState()

    // 1. Add relationships
    let relationshipsAdded = 0
    config.relationships.forEach(rel => {
      try {
        addRelationship(rel as Relationship)
        relationshipsAdded++
      } catch (err) {
        console.warn('Failed to add relationship:', rel, err)
      }
    })

    // 2. Add tools
    const toolKeyToId = new Map<string, string>()
    let toolsAdded = 0
    
    config.tools.forEach(tool => {
      try {
        const targetNode = tool.targetNodeId ? nodes.find(n => n.id === tool.targetNodeId) : undefined
        
        if (tool.targetNodeId && !targetNode) {
          console.warn('[TOOL_IMPORT] Tool skipped - target node not found:', tool.targetNodeId, tool.label)
          return
        }
        
        const toolKey = targetNode 
          ? `${targetNode.label}::${tool.type}` 
          : (tool.label || tool.type)
        
        if (toolKeyToId.has(toolKey)) return

        const existingTool = existingToolNodes.find(t => {
          if (targetNode) {
            return t.targetNodeId === targetNode.id && t.type === tool.type
          } else {
            return t.label === tool.label && t.type === tool.type
          }
        })
        
        if (existingTool) {
          toolKeyToId.set(toolKey, existingTool.id)
          return
        }
        
        const toolPosition = tool.position || (targetNode ? {
          x: targetNode.position.x + 250,
          y: targetNode.position.y
        } : { x: 100, y: 100 })
        
        const realId = addToolNode({
          ...tool,
          targetNodeId: targetNode?.id,
          position: toolPosition
        })
        
        if (targetNode) {
          const hasNodeToToolEdge = config.toolEdges.some(edge =>
            edge.sourceNodeLabel === targetNode.label &&
            edge.targetToolLabel === toolKey
          )
          
          if (!hasNodeToToolEdge) {
            addToolEdge({
              source: targetNode.id,
              target: realId,
              sourceHandle: 'tools',
              targetHandle: 'input-0'
            })
          }
        }
        
        toolKeyToId.set(toolKey, realId)
        toolsAdded++
      } catch (err) {
        console.warn('[TOOL_IMPORT] Failed to add tool:', tool, err)
      }
    })

    // 3. Add actions (first pass: groups and top-level)
    const actionLabelToIds = new Map<string, string[]>()
    const actionIdToIndex = new Map<string, number>()
    const importedActionIndexToRealId = new Map<number, string>()
    let actionsAdded = 0

    config.actions.forEach((action, index) => {
      try {
        const realId = addActionNode(action as any)
        const existing = actionLabelToIds.get(action.label) || []
        actionLabelToIds.set(action.label, [...existing, realId])
        importedActionIndexToRealId.set(index, realId)
        actionIdToIndex.set(realId, index)
        actionsAdded++
      } catch (err) {
        console.warn('Failed to add action:', action, err)
      }
    })

    // 4. Add child actions
    config.actions.forEach((importedAction, index) => {
      if (importedAction.isGroup && (importedAction as any)._childActions) {
        const groupRealId = importedActionIndexToRealId.get(index)
        if (groupRealId) {
          const childActions = (importedAction as any)._childActions
          const remappedChildren: string[] = []

          childActions.forEach((childAction: any) => {
            try {
              const childRealId = addActionNode(childAction)
              remappedChildren.push(childRealId)
              const existing = actionLabelToIds.get(childAction.label) || []
              actionLabelToIds.set(childAction.label, [...existing, childRealId])
            } catch (err) {
              console.warn('Failed to add child action:', childAction, err)
            }
          })

          if (remappedChildren.length > 0) {
            updateActionNode(groupRealId, { children: remappedChildren })
          }
        }
      }
    })

      let toolEdgesAdded = 0
      config.toolEdges.forEach((edge) => {
        // Handle node-to-tool edges (source is a node, not a tool)
        let sourceId: string | undefined
        if (edge.sourceNodeLabel) {
          // Source is a node (new format)
          const sourceNode = nodes.find(n => n.label === edge.sourceNodeLabel)
          if (!sourceNode) {
            console.warn('Tool edge skipped - source node not found:', edge.sourceNodeLabel)
            return
          }
          sourceId = sourceNode.id
        } else if (edge.sourceHandle === 'tools' && (!edge.sourceToolLabel || edge.sourceToolLabel === '')) {
          // Backward compatibility: empty sourceToolLabel with sourceHandle='tools' means source is a node
          // Try to infer from target tool's node label (most common case: node connects to its own tool)
          if (edge.targetToolLabel) {
            const [nodeLabel] = edge.targetToolLabel.split('::')
            const sourceNode = nodes.find(n => n.label === nodeLabel)
            if (sourceNode) {
              sourceId = sourceNode.id
            } else {
              // If we can't find the node from the target tool label, try to find any node
              // that has a tool matching the target tool label
              const targetToolKey = edge.targetToolLabel
              const targetToolId = toolKeyToId.get(targetToolKey)
              if (targetToolId) {
                const targetTool = useToolCanvasStore.getState().nodes.find(t => t.id === targetToolId)
                if (targetTool?.targetNodeId) {
                  sourceId = targetTool.targetNodeId
                } else {
                  console.warn('Tool edge skipped - cannot infer source node from target tool:', edge.targetToolLabel)
                  return
                }
              } else {
                console.warn('Tool edge skipped - target tool not found:', edge.targetToolLabel)
                return
              }
            }
          } else {
            console.warn('Tool edge skipped - cannot infer source node without target tool label')
            return
          }
        } else if (edge.sourceToolLabel) {
          // Source is a tool
          sourceId = toolKeyToId.get(edge.sourceToolLabel)
          if (!sourceId) {
            console.warn('Tool edge skipped - source tool not found:', edge.sourceToolLabel)
            return
          }
        } else {
          console.warn('Tool edge skipped - no source specified')
          return
        }

        if (edge.targetToolLabel) {
          const targetId = toolKeyToId.get(edge.targetToolLabel)
          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        } else if (edge.targetActionLabel) {
          // Find action by label - if multiple exist, use the one that matches the source tool
          const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
          let targetId: string | undefined

          if (candidateIds.length === 1) {
            targetId = candidateIds[0]
          } else if (candidateIds.length > 1) {
            // Multiple actions with same label - find the one connected to this tool in actionEdges
            const matchingEdge = config.actionEdges.find(ae =>
              (ae.sourceToolLabel === edge.sourceToolLabel ||
                (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
              ae.targetActionLabel === edge.targetActionLabel
            )
            if (matchingEdge) {
              // Find the action index in the original actions array by matching config/position
              const actionIndex = config.actions.findIndex(a =>
                a.label === edge.targetActionLabel &&
                JSON.stringify(a.config) === JSON.stringify(config.actions.find(a2 =>
                  config.actionEdges.findIndex(ae2 =>
                    (ae2.sourceToolLabel === edge.sourceToolLabel ||
                      (edge.sourceNodeLabel && !ae2.sourceToolLabel)) &&
                    ae2.targetActionLabel === a2.label
                  ) !== -1
                )?.config)
              )
              // Use the action at the same index in actionEdges as this edge
              const edgeIndex = config.actionEdges.findIndex(ae =>
                (ae.sourceToolLabel === edge.sourceToolLabel ||
                  (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
                ae.targetActionLabel === edge.targetActionLabel
              )
              if (edgeIndex >= 0 && edgeIndex < candidateIds.length) {
                targetId = candidateIds[edgeIndex]
              } else {
                targetId = candidateIds[0]
              }
            } else {
              targetId = candidateIds[0]
            }
          }

          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        }
      })

      // Add action edges
      let actionEdgesAdded = 0
      const connectedActionIds = new Set<string>()
      // Map to track which action candidate index to use for each unique tool+label combination
      // This ensures that Verse::tool:if -> Skip uses a different Skip action than Seg::tool:if -> Skip
      const toolLabelToActionIndex = new Map<string, number>()
      // Track which action IDs have been used for each label
      const labelToUsedIndices = new Map<string, Set<number>>()

      config.actionEdges.forEach((edge) => {
        let sourceId: string | undefined

        if (edge.sourceToolLabel) {
          sourceId = toolKeyToId.get(edge.sourceToolLabel)
        }

        if (!sourceId) {
          console.warn('Action edge skipped - source tool not found:', edge.sourceToolLabel)
          return
        }

        const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
        if (candidateIds.length === 0) {
          console.warn('Action edge skipped - target action not found:', edge.targetActionLabel)
          return
        }

        // Create a unique key for this tool+action combination
        const toolActionKey = `${edge.sourceToolLabel}::${edge.targetActionLabel}`
        let actionIndex = toolLabelToActionIndex.get(toolActionKey)

        if (actionIndex === undefined) {
          // First time seeing this combination, use index 0
          actionIndex = 0
          toolLabelToActionIndex.set(toolActionKey, 0)
        } else {
          // Check if this index has already been used for this label
          const usedIndices = labelToUsedIndices.get(edge.targetActionLabel) || new Set()
          if (usedIndices.has(actionIndex)) {
            // This index is already used, try the next one
            actionIndex = (actionIndex + 1) % candidateIds.length
            toolLabelToActionIndex.set(toolActionKey, actionIndex)
          }
        }

        // Mark this index as used for this label
        const usedIndices = labelToUsedIndices.get(edge.targetActionLabel) || new Set()
        usedIndices.add(actionIndex)
        labelToUsedIndices.set(edge.targetActionLabel, usedIndices)

        const targetId = candidateIds[actionIndex]

        if (targetId && !connectedActionIds.has(targetId)) {
          addActionEdge({
            source: sourceId,
            target: targetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          })
          connectedActionIds.add(targetId)
          actionEdgesAdded++
        }
      })
    // 7. Connect unconnected actions
    const allActionIds = new Set<string>()
    actionLabelToIds.forEach(ids => ids.forEach(id => allActionIds.add(id)))
    const unconnectedActionIds = Array.from(allActionIds).filter(id => !connectedActionIds.has(id))

    if (unconnectedActionIds.length > 0 && toolKeyToId.size > 0) {
      const toolIds = Array.from(toolKeyToId.values())
      const connectingToolId = toolIds[toolIds.length - 1]
      const connectingTool = config.tools.find(t => {
        const targetNode = nodes.find(n => n.id === t.targetNodeId)
        if (!targetNode) return false
        const key = `${targetNode.label}::${t.type}`
        return toolKeyToId.get(key) === connectingToolId
      })

      if (connectingTool && connectingTool.outputs && connectingTool.outputs.length > 0) {
        unconnectedActionIds.forEach(actionId => {
          addActionEdge({
            source: connectingToolId,
            target: actionId,
            sourceHandle: (connectingTool as any).outputs[0]?.id || 'output-1',
            targetHandle: 'input-1'
          })
          actionEdgesAdded++
        })
      }
    }

    if (config.rootNodeId) {
      setRootNodeId(config.rootNodeId)
    }

    return {
      relationshipsAdded,
      toolsAdded,
      actionsAdded,
      toolEdgesAdded,
      actionEdgesAdded,
      originalCounts: config._originalCounts
    }
  },

  /**
   * Checks if the current workflow has unsaved changes compared to a saved configuration.
   * Only considers structural changes (tools, actions, edges, connections) and ignores positions.
   */
  hasUnsavedChanges: (savedConfig: WorkflowConfigExport | null): boolean => {
    if (!savedConfig) {
      const current = workflowService.getCurrentWorkflowConfig()
      return !!(current && (current.tools?.length || current.actions?.length))
    }

    try {
      const currentConfig = workflowService.getCurrentWorkflowConfig()
      if (!currentConfig) return false

      // Normalize configs by removing position fields and other non-structural data
      const normalize = (config: any) => {
        if (!config) return { tools: [], actions: [], toolEdges: [], actionEdges: [] }
        
        const normalized = JSON.parse(JSON.stringify(config))
        
        // Ensure arrays exist
        if (!Array.isArray(normalized.tools)) normalized.tools = []
        if (!Array.isArray(normalized.actions)) normalized.actions = []
        if (!Array.isArray(normalized.toolEdges)) normalized.toolEdges = []
        if (!Array.isArray(normalized.actionEdges)) normalized.actionEdges = []

        // Normalize tools (remove positions, sort)
        normalized.tools = normalized.tools.map((tool: any) => ({
          type: tool.type,
          label: tool.label,
          targetNodeLabel: tool.targetNodeLabel,
          config: tool.config || {},
          inputs: tool.inputs,
          outputs: tool.outputs || []
        })).sort((a: any, b: any) => (a.targetNodeLabel || '').localeCompare(b.targetNodeLabel || '') || a.type.localeCompare(b.type))

        // Normalize actions (remove positions, sort)
        normalized.actions = normalized.actions.map((action: any) => {
          const { position, ...rest } = action
          if (Array.isArray(rest.children)) {
            rest.children = rest.children.map((c: any) => ({
              type: c.type,
              label: c.label,
              config: c.config || {}
            })).sort((a: any, b: any) => a.label.localeCompare(b.label))
          }
          return {
            type: rest.type,
            label: rest.label,
            config: rest.config || {},
            isGroup: rest.isGroup || false,
            children: rest.children,
            enabled: rest.enabled !== undefined ? rest.enabled : true
          }
        }).sort((a: any, b: any) => a.label.localeCompare(b.label))

        // Normalize toolEdges
        normalized.toolEdges = normalized.toolEdges.map((edge: any) => ({
          sourceNodeLabel: edge.sourceNodeLabel,
          sourceToolLabel: edge.sourceToolLabel,
          targetToolLabel: edge.targetToolLabel,
          targetActionLabel: edge.targetActionLabel,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        })).sort((a: any, b: any) => {
          const aKey = `${a.sourceNodeLabel || a.sourceToolLabel || ''}-${a.targetToolLabel || a.targetActionLabel || ''}`
          const bKey = `${b.sourceNodeLabel || b.sourceToolLabel || ''}-${b.targetToolLabel || b.targetActionLabel || ''}`
          return aKey.localeCompare(bKey)
        })

        // Normalize actionEdges
        normalized.actionEdges = normalized.actionEdges.map((edge: any) => ({
          sourceToolLabel: edge.sourceToolLabel,
          targetActionLabel: edge.targetActionLabel,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        })).sort((a: any, b: any) => {
          const aKey = `${a.sourceToolLabel || ''}-${a.targetActionLabel || ''}`
          const bKey = `${b.sourceToolLabel || ''}-${b.targetActionLabel || ''}`
          return aKey.localeCompare(bKey)
        })

        return {
          tools: normalized.tools,
          actions: normalized.actions,
          toolEdges: normalized.toolEdges,
          actionEdges: normalized.actionEdges
        }
      }

      const currentJson = JSON.stringify(normalize(currentConfig))
      const savedJson = JSON.stringify(normalize(savedConfig))
      
      return currentJson !== savedJson
    } catch (error) {
      console.error('Error checking for unsaved workflow changes:', error)
      return false
    }
  }

}
