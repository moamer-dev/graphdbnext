import type { GraphNode } from '@/app/dashboard/hooks/useNodeList'

export function getNodeSpecificLabel (node: GraphNode): string {
  const labels = node.labels || []
  return labels.length > 0 ? labels[labels.length - 1] : ''
}

export function getNodeLabel (node: GraphNode): string {
  const labels = node.labels || []
  const label = labels.length > 0 ? labels[labels.length - 1] : 'Node'
  
  if (node.properties.text) {
    return `${label}: "${String(node.properties.text)}"`
  }
  return label
}
