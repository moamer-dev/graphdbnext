import type { Node } from '../types'

export interface ToolOutput {
  id: string
  label: string
}

export interface WorkflowNode {
  id: string
  type: string
  label?: string
  config?: Record<string, unknown>
  position: { x: number; y: number }
}

export class WorkflowApplicationService {
  static findTargetNodeFromWorkflow(
    nodes: Node[],
    actionNodes: Array<{ config?: Record<string, unknown> }>
  ): Node | undefined {
    const allNodeLabels = new Set<string>()
    
    actionNodes.forEach(action => {
      const config = action.config || {}
      if (config.parentNodeLabel) allNodeLabels.add(String(config.parentNodeLabel))
      if (config.nodeLabel) allNodeLabels.add(String(config.nodeLabel))
      if (config.targetNodeLabel) allNodeLabels.add(String(config.targetNodeLabel))
    })
    
    if (allNodeLabels.size > 0) {
      const matchingNode = nodes.find(n => 
        Array.from(allNodeLabels).some(label => 
          n.label.toLowerCase() === label.toLowerCase() ||
          n.type.toLowerCase() === label.toLowerCase()
        )
      )
      if (matchingNode) {
        return matchingNode
      }
    }
    
    return nodes.length > 0 ? nodes[0] : undefined
  }

  static calculateToolOutputs(
    toolType: string,
    config?: Record<string, unknown>
  ): ToolOutput[] | undefined {
    switch (toolType) {
      case 'tool:if':
        return [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]
      case 'tool:switch':
        if (config?.switchCases && Array.isArray(config.switchCases)) {
          const switchCases = config.switchCases as Array<{ value: string; label: string }>
          if (switchCases.length > 0) {
            const caseOutputs = switchCases.map(case_ => ({ id: case_.label, label: case_.label }))
            caseOutputs.push({ id: 'default', label: 'Default' })
            return caseOutputs
          }
        }
        return [{ id: 'default', label: 'Default' }]
      default:
        return undefined
    }
  }

  static calculateNodePosition(
    targetNode: Node | undefined,
    index: number,
    defaultPosition: { x: number; y: number }
  ): { x: number; y: number } {
    if (index === 0 && targetNode) {
      return { x: targetNode.position.x + 250, y: targetNode.position.y }
    }
    return defaultPosition
  }
}

