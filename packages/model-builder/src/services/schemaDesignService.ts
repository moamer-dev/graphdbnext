import type { Node, Relationship } from '../types'

export interface FindNodesResult {
  source?: Node
  target?: Node
}

export class SchemaDesignService {
  static extractNodeIdFromResult(result: string): string | null {
    const idMatch = result.match(/ID: (node_\d+_[a-z0-9]+)/)
    return idMatch ? idMatch[1] : null
  }

  static extractRelationshipIdFromResult(result: string): string | null {
    const idMatch = result.match(/ID: (rel_\d+_[a-z0-9]+)/)
    return idMatch ? idMatch[1] : null
  }

  static findNodeByLabel(nodes: Node[], label: string): Node | undefined {
    return nodes.find(n => 
      n.label === label || 
      n.type === label.replace(/\s+/g, '')
    )
  }

  static findNodesByMessage(
    nodes: Node[],
    message: string,
    suggestionNodeLabel?: string,
    excludeId?: string
  ): FindNodesResult {
    const messageLower = message.toLowerCase()
    
    const sourceNode = nodes.find(n => 
      n.id !== excludeId && 
      messageLower.includes(n.label.toLowerCase())
    )
    
    const targetNode = nodes.find(n => 
      n.id !== sourceNode?.id && 
      n.id !== excludeId &&
      (messageLower.includes(n.label.toLowerCase()) || 
       (suggestionNodeLabel && suggestionNodeLabel.toLowerCase() === n.label.toLowerCase()))
    )

    return { source: sourceNode, target: targetNode }
  }

  static findRelationshipById(relationships: Relationship[], id: string): Relationship | undefined {
    return relationships.find(r => r.id === id)
  }

  static findRelationshipByCriteria(
    relationships: Relationship[],
    type: string,
    from: string,
    to: string
  ): Relationship | undefined {
    return relationships.find(r => 
      r.type === type &&
      r.from === from &&
      r.to === to
    )
  }

  static sortRelationshipsByTimestamp(relationships: Relationship[]): Relationship[] {
    return [...relationships].sort((a, b) => {
      const aMatch = a.id.match(/rel_(\d+)_/)
      const bMatch = b.id.match(/rel_(\d+)_/)
      if (aMatch && bMatch) {
        return parseInt(bMatch[1]) - parseInt(aMatch[1])
      }
      return 0
    })
  }
}

