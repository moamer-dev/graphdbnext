import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ActionCanvasEdge } from '../../../stores/actionCanvasStore'
import type { ExecutionContext } from '../types'

export function createGetApiResponseData(
  toolNodes: ToolCanvasNode[],
  actionNodes: ActionCanvasNode[],
  actionEdges: ActionCanvasEdge[]
) {
  return function getApiResponseData(
    action: ActionCanvasNode,
    ctx: ExecutionContext
  ): unknown {
    if (ctx.apiData) {
      const apiDataKeys = Object.keys(ctx.apiData)
      if (apiDataKeys.length > 0) {
        return ctx.apiData[apiDataKeys[0]]
      }
    }
    
    const incomingEdges = actionEdges.filter(edge => edge.target === action.id)
    for (const edge of incomingEdges) {
      const sourceTool = toolNodes.find(t => t.id === edge.source)
      if (sourceTool && (
        sourceTool.type === 'tool:fetch-api' ||
        sourceTool.type === 'tool:fetch-orcid' ||
        sourceTool.type === 'tool:fetch-geonames' ||
        sourceTool.type === 'tool:fetch-europeana' ||
        sourceTool.type === 'tool:fetch-getty' ||
        sourceTool.type === 'tool:http'
      )) {
        const apiResponseData = sourceTool.config?.executedResponse as unknown
        if (apiResponseData) {
          return apiResponseData
        }
      }
    }
    
    const parentGroup = actionNodes.find(group => 
      (group.type === 'action:group' || group.isGroup === true) &&
      group.children?.includes(action.id)
    )
    
    if (parentGroup) {
      const groupIncomingEdges = actionEdges.filter(edge => edge.target === parentGroup.id)
      for (const edge of groupIncomingEdges) {
        const sourceTool = toolNodes.find(t => t.id === edge.source)
        if (sourceTool && (
          sourceTool.type === 'tool:fetch-api' ||
          sourceTool.type === 'tool:fetch-orcid' ||
          sourceTool.type === 'tool:fetch-geonames' ||
          sourceTool.type === 'tool:fetch-europeana' ||
          sourceTool.type === 'tool:fetch-getty' ||
          sourceTool.type === 'tool:http'
        )) {
          const apiResponseData = sourceTool.config?.executedResponse as unknown
          if (apiResponseData) {
            return apiResponseData
          }
        }
      }
    }
    
    return null
  }
}

