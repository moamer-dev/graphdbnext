import { workflowRegistry } from '../registry'

export const labelFromType = (type: string) => {
  if (type.startsWith('tool:')) {
    const tool = workflowRegistry.getTool(type)
    if (tool) return tool.metadata.label
  }
  if (type.startsWith('action:')) {
    const action = workflowRegistry.getAction(type)
    if (action) return action.metadata.label
  }
  
  // Hand-coded fallbacks for legacy or internal types
  if (type === 'action:group') return 'Action Group'
  if (type === 'action:skip') return 'Skip'
  
  return type
}

export const isWorkflowNodeId = (id?: string) => Boolean(id && id.startsWith('wfn_'))
export const isToolNodeId = (id?: string) => Boolean(id && id.startsWith('tool_'))
export const isActionNodeId = (id?: string) => Boolean(id && id.startsWith('action_'))
export const isActionGroupNodeId = (id: string | undefined, actionNodes: any[]) => {
  if (!id || !id.startsWith('action_')) {
    return false
  }
  const actionNode = actionNodes.find(n => n.id === id)
  return actionNode?.type === 'action:group' || actionNode?.isGroup === true
}
export const isMainNodeId = (id?: string) => Boolean(id && !id.startsWith('wfn_') && !id.startsWith('tool_') && !id.startsWith('action_'))

export const mapDragTypeToStep = (type: string): any | null => {
  if (type === 'tool:if' || type === 'tool:switch' || type === 'tool:loop' || type === 'tool:filter') {
    return { kind: 'condition', type: 'has-children', guard: 'always', config: {} }
  }
  if (type === 'action:create-node') {
    return { kind: 'action', type: 'create-node', guard: 'always', config: { parentRelationship: 'contains' } }
  }
  if (type === 'action:create-relationship') {
    return { kind: 'action', type: 'create-relationship', guard: 'always', config: { relationshipType: 'relatedTo' } }
  }
  if (type === 'action:set-property') {
    return { kind: 'action', type: 'set-property', guard: 'always', config: { propertyKey: '', value: '' } }
  }
  if (type === 'action:skip') {
    return { kind: 'action', type: 'skip', guard: 'always', config: {} }
  }
  if (type === 'action:create-node-text') {
    return { kind: 'action', type: 'create-node-text', guard: 'always', config: {} }
  }
  if (type === 'action:create-node-tokens') {
    return { kind: 'action', type: 'create-node-tokens', guard: 'always', config: {} }
  }
  return null
}
