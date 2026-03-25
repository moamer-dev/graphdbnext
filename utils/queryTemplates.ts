export interface QueryTemplate {
  id: string
  name: string
  description: string
  category: 'explore' | 'search' | 'analyze' | 'text'
  query: string
  parameters?: QueryParameter[]
  example?: string
}

export interface QueryParameter {
  name: string
  label: string
  type: 'string' | 'number' | 'label' | 'relationship' | 'property'
  placeholder?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'find-by-label',
    name: 'Find Nodes by Label',
    description: 'Find all nodes with a specific label',
    category: 'explore',
    query: 'MATCH (n:{label}) RETURN n LIMIT {limit}',
    parameters: [
      {
        name: 'label',
        label: 'Node Label',
        type: 'label',
        required: true,
        options: [
          { label: 'Sign', value: 'Sign' },
          { label: 'Word', value: 'Word' },
          { label: 'Line', value: 'Line' },
          { label: 'Colon', value: 'Colon' },
          { label: 'Verse', value: 'Verse' },
          { label: 'Stanza', value: 'Stanza' },
          { label: 'Part', value: 'Part' },
          { label: 'Seg', value: 'Seg' },
          { label: 'Character', value: 'Character' },
          { label: 'Annotation', value: 'Annotation' }
        ]
      },
      {
        name: 'limit',
        label: 'Limit Results',
        type: 'number',
        required: false,
        placeholder: '10'
      }
    ]
  },
  {
    id: 'find-by-property',
    name: 'Find Nodes by Property',
    description: 'Search for nodes with a specific property value',
    category: 'search',
    query: 'MATCH (n) WHERE n.{property} = {value} RETURN n',
    parameters: [
      {
        name: 'property',
        label: 'Property Name',
        type: 'property',
        required: true,
        placeholder: 'id'
      },
      {
        name: 'value',
        label: 'Property Value',
        type: 'string',
        required: true,
        placeholder: 'l1'
      }
    ]
  },
  {
    id: 'find-relationships',
    name: 'Find Relationships',
    description: 'Find all relationships of a specific type',
    category: 'explore',
    query: 'MATCH (a)-[r:{relationshipType}]->(b) RETURN a, r, b LIMIT {limit}',
    parameters: [
      {
        name: 'relationshipType',
        label: 'Relationship Type',
        type: 'relationship',
        required: true,
        options: [
          { label: 'contains', value: 'contains' },
          { label: 'refersTo', value: 'refersTo' },
          { label: 'annotates', value: 'annotates' },
          { label: 'translatedAs', value: 'translatedAs' },
          { label: 'alternative', value: 'alternative' },
          { label: 'hasLayer', value: 'hasLayer' }
        ]
      },
      {
        name: 'limit',
        label: 'Limit Results',
        type: 'number',
        required: false,
        placeholder: '10'
      }
    ]
  },
  {
    id: 'find-path',
    name: 'Find Path Between Nodes',
    description: 'Find the shortest path between two nodes',
    category: 'analyze',
    query: 'MATCH path = shortestPath((a)-[*]-(b)) WHERE id(a) = {startId} AND id(b) = {endId} RETURN path',
    parameters: [
      {
        name: 'startId',
        label: 'Start Node ID',
        type: 'number',
        required: true,
        placeholder: '0'
      },
      {
        name: 'endId',
        label: 'End Node ID',
        type: 'number',
        required: true,
        placeholder: '100'
      }
    ]
  },
  {
    id: 'find-text-content',
    name: 'Find Text Content',
    description: 'Find all Sign or Character nodes with specific text',
    category: 'text',
    query: 'MATCH (n) WHERE n.text = {text} RETURN n LIMIT {limit}',
    parameters: [
      {
        name: 'text',
        label: 'Text Content',
        type: 'string',
        required: true,
        placeholder: 'a'
      },
      {
        name: 'limit',
        label: 'Limit Results',
        type: 'number',
        required: false,
        placeholder: '10'
      }
    ]
  },
  {
    id: 'find-line-content',
    name: 'Get Line Content',
    description: 'Get all content within a specific line',
    category: 'text',
    query: 'MATCH (line:Line {n: {lineNumber}})-[:contains*]->(content) RETURN content ORDER BY content.index',
    parameters: [
      {
        name: 'lineNumber',
        label: 'Line Number',
        type: 'string',
        required: true,
        placeholder: 'i 1'
      }
    ]
  },
  {
    id: 'find-annotations',
    name: 'Find Annotations',
    description: 'Find all annotations for a specific node',
    category: 'analyze',
    query: 'MATCH (n)-[:annotatedBy]->(annotation:Annotation) WHERE id(n) = {nodeId} RETURN annotation',
    parameters: [
      {
        name: 'nodeId',
        label: 'Node ID',
        type: 'number',
        required: true,
        placeholder: '0'
      }
    ]
  },
  {
    id: 'count-by-label',
    name: 'Count Nodes by Label',
    description: 'Count how many nodes exist for each label',
    category: 'analyze',
    query: 'MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC',
    parameters: []
  },
  {
    id: 'find-alternatives',
    name: 'Find Alternatives',
    description: 'Find all alternative readings for a node',
    category: 'analyze',
    query: 'MATCH (alt:Alternative)-[:alternative]->(n) WHERE id(n) = {nodeId} RETURN alt',
    parameters: [
      {
        name: 'nodeId',
        label: 'Node ID',
        type: 'number',
        required: true,
        placeholder: '0'
      }
    ]
  },
  {
    id: 'find-translations',
    name: 'Find Translations',
    description: 'Find all translations for a colon',
    category: 'text',
    query: 'MATCH (colon:Colon)-[:translatedAs]->(translation:TranslationUnit) WHERE colon.n = {colonNumber} RETURN translation',
    parameters: [
      {
        name: 'colonNumber',
        label: 'Colon Number',
        type: 'string',
        required: true,
        placeholder: '1'
      }
    ]
  }
]

export function getTemplateById(id: string): QueryTemplate | undefined {
  return QUERY_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: QueryTemplate['category']): QueryTemplate[] {
  return QUERY_TEMPLATES.filter(t => t.category === category)
}

export function replaceQueryParameters(query: string, parameters: Record<string, unknown>, template?: QueryTemplate): string {
  let result = query
  
  // Get all parameter definitions
  const allParamNames = template?.parameters?.map(p => p.name) || []
  
  // First pass: Handle optional parameters that are empty or missing
  for (const paramName of allParamNames) {
    const paramDef = template?.parameters?.find(p => p.name === paramName)
    const placeholder = `{${paramName}}`
    const value = parameters[paramName]
    const isEmpty = value === '' || value === null || value === undefined
    
    // If parameter is optional and empty/missing, remove the clause containing it
    if (paramDef && !paramDef.required && isEmpty) {
      // Remove LIMIT clause if limit is empty/missing
      if (paramName === 'limit') {
        const limitRegex = new RegExp(`\\s+LIMIT\\s+${placeholder.replace(/[{}]/g, '\\$&')}`, 'gi')
        result = result.replace(limitRegex, '')
      } else {
        // For other optional parameters, just remove the placeholder
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), '')
      }
    }
  }
  
  // Second pass: Replace all provided non-empty parameters
  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{${key}}`
    if (!result.includes(placeholder)) continue
    
    // Skip if value is empty (already handled in first pass)
    if (value === '' || value === null || value === undefined) continue
    
    // Check if this parameter should not be quoted (labels, relationship types, property names)
    const paramDef = template?.parameters?.find(p => p.name === key)
    const isLabelOrRelationship = paramDef && (paramDef.type === 'label' || paramDef.type === 'relationship')
    const isProperty = paramDef && paramDef.type === 'property'
    const isNumber = paramDef && paramDef.type === 'number'
    
    // Also check context: if placeholder is after : or inside [], don't quote
    const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&')
    const regex = new RegExp(`([:\\[])\\s*${escapedPlaceholder}`, 'g')
    const isInLabelContext = regex.test(result)
    
    // Check if placeholder is in property context (after dot notation like n.{property})
    const propertyRegex = new RegExp(`\\.\\s*${escapedPlaceholder}`, 'g')
    const isInPropertyContext = propertyRegex.test(result)
    
    // Check if placeholder is in property value comparison context (after = or other operators)
    const valueComparisonRegex = new RegExp(`(WHERE|AND|OR|,)\\s*[^=<>!]*\\s*[=<>!]+\\s*${escapedPlaceholder}`, 'gi')
    const isInValueComparisonContext = valueComparisonRegex.test(result)
    
    // Convert number parameters to integers (not quoted)
    if (isNumber) {
      const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value)
      if (!isNaN(numValue)) {
        result = result.replace(new RegExp(escapedPlaceholder, 'g'), String(numValue))
        continue
      }
    }
    
    // For property value comparisons, check if value looks like a number
    // If it does, don't quote it (allows matching numeric properties)
    if (isInValueComparisonContext && typeof value === 'string') {
      const trimmedValue = value.trim()
      // Check if it's a valid number (integer or float)
      const numValue = Number(trimmedValue)
      if (!isNaN(numValue) && isFinite(numValue) && trimmedValue === String(numValue)) {
        // It's a valid number, don't quote it
        result = result.replace(new RegExp(escapedPlaceholder, 'g'), trimmedValue)
        continue
      }
    }
    
    // Don't quote if it's a label/relationship type, property name, or in label/property context
    if (typeof value === 'string' && !isLabelOrRelationship && !isProperty && !isInLabelContext && !isInPropertyContext) {
      result = result.replace(new RegExp(escapedPlaceholder, 'g'), `"${value}"`)
    } else {
      result = result.replace(new RegExp(escapedPlaceholder, 'g'), String(value))
    }
  }
  
  // Final cleanup: Remove any remaining placeholders (safety check)
  result = result.replace(/\{[^}]+\}/g, '')
  
  // Clean up extra whitespace (multiple spaces, but preserve newlines in multi-line queries)
  result = result.replace(/[ \t]+/g, ' ').trim()
  
  return result
}

