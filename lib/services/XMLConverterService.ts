// Re-export types for public API
export type {
  GraphElement,
  GraphNode,
  GraphRelationship
} from '../xmlConverter/types'

// Internal implementation - not part of public API
import type { GraphElement, GraphNode, GraphRelationship } from '../xmlConverter/types'
import { XMLToGraphConverter } from '../xmlConverter/converter'

/**
 * Service for converting XML content to graph elements (nodes and relationships)
 * 
 * This service provides a unified interface for XML to graph conversion,
 * following the same pattern as other services in the @services directory.
 * 
 * The implementation details are kept in @xmlConverter as private modules.
 */
export class XMLConverterService {
  /**
   * Convert XML content to an array of graph elements (nodes and relationships)
   * 
   * @param xmlContent - The XML content as a string
   * @returns Array of graph elements (nodes and relationships)
   */
  convertXMLToGraph (xmlContent: string): GraphElement[] {
    const converter = new XMLToGraphConverter(xmlContent)
    return converter.convert()
  }

  /**
   * Convert XML content to graph elements and separate nodes from relationships
   * 
   * @param xmlContent - The XML content as a string
   * @returns Object containing separated nodes and relationships arrays
   */
  convertXMLToGraphSeparated (xmlContent: string): {
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  } {
    const elements = this.convertXMLToGraph(xmlContent)
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []

    for (const element of elements) {
      if (element.type === 'node') {
        nodes.push(element)
      } else if (element.type === 'relationship') {
        relationships.push(element)
      }
    }

    return { nodes, relationships }
  }

  /**
   * Type guard to check if an element is a graph node
   */
  isGraphNode (element: GraphElement): element is GraphNode {
    return element.type === 'node'
  }

  /**
   * Type guard to check if an element is a graph relationship
   */
  isGraphRelationship (element: GraphElement): element is GraphRelationship {
    return element.type === 'relationship'
  }
}

