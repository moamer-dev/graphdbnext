import type { Schema, SchemaNode, SchemaRelation, SchemaProperty } from '@/lib/services/SchemaLoaderService'

/**
 * Normalize schema to ensure all required fields are present
 * This function ensures backward compatibility with schemas that may be missing
 * required fields (e.g., created before the export format was standardized)
 */
export function normalizeSchema (schema: unknown): Schema | null {
  if (!schema || typeof schema !== 'object') return null
  
  const schemaObj = schema as Record<string, unknown>
  if (!schemaObj.nodes || !schemaObj.relations) return null

  const normalizedNodes: Record<string, SchemaNode> = {}
  const normalizedRelations: Record<string, SchemaRelation> = {}

  // Normalize nodes
  const nodes = schemaObj.nodes as Record<string, Record<string, unknown>>
  Object.entries(nodes).forEach(([key, node]) => {
    normalizedNodes[key] = {
      name: (typeof node.name === 'string' ? node.name : key),
      superclassNames: Array.isArray(node.superclassNames) ? node.superclassNames : [],
      properties: (node.properties && typeof node.properties === 'object' ? node.properties : {}) as Record<string, SchemaProperty>,
      relationsOut: (node.relationsOut && typeof node.relationsOut === 'object' ? node.relationsOut : {}) as Record<string, string[]>,
      relationsIn: (node.relationsIn && typeof node.relationsIn === 'object' ? node.relationsIn : {}) as Record<string, string[]>
    }
  })

  // Normalize relations
  const relations = schemaObj.relations as Record<string, Record<string, unknown>>
  Object.entries(relations).forEach(([key, relation]) => {
    normalizedRelations[key] = {
      name: (typeof relation.name === 'string' ? relation.name : key),
      properties: (relation.properties && typeof relation.properties === 'object' ? relation.properties : {}) as Record<string, SchemaProperty>,
      domains: (relation.domains && typeof relation.domains === 'object' ? relation.domains : {}) as Record<string, string[]>
    }
  })

  return {
    nodes: normalizedNodes,
    relations: normalizedRelations
  }
}

