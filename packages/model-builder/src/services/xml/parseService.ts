/**
 * Parsing service for CSV and bulk input
 */

/**
 * Parse a CSV line handling quoted values and escaped quotes
 */
export function parseCSVLine (line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  return result
}

export interface ParsedNode {
  label: string
  type: string
  groupName?: string
}

/**
 * Parse bulk input for nodes
 * Supports formats: label:type, label,type, label:type:group, label,type,group, or single word
 */
export function parseBulkNodeInput (input: string): ParsedNode[] {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const nodes: ParsedNode[] = []
  
  // Check if first line looks like a CSV header (optional)
  let startIndex = 0
  const firstLine = lines[0]?.toLowerCase()
  if (firstLine && (firstLine.includes('label') || firstLine.includes('type') || firstLine.includes('group'))) {
    startIndex = 1 // Skip header row
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    
    // Try CSV format first (label,type or label,type,group)
    if (line.includes(',')) {
      const parts = parseCSVLine(line)
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const node: ParsedNode = { 
          label: parts[0].replace(/^"|"$/g, ''), 
          type: parts[1].replace(/^"|"$/g, '') 
        }
        // If third part exists, store the group name
        if (parts.length >= 3 && parts[2]) {
          node.groupName = parts[2].replace(/^"|"$/g, '')
        }
        nodes.push(node)
        continue
      }
    }
    
    // Try colon format (label:type or label:type:group)
    if (line.includes(':')) {
      const parts = line.split(':').map(p => p.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const node: ParsedNode = { label: parts[0], type: parts[1] }
        // If third part exists, store the group name
        if (parts.length >= 3 && parts[2]) {
          node.groupName = parts[2]
        }
        nodes.push(node)
        continue
      }
    }
    
    // Single word - use as both label and type
    if (line.length > 0) {
      nodes.push({ label: line, type: line })
    }
  }
  
  return nodes
}

export interface ParsedRelationship {
  from: string
  to: string
  type: string
}

/**
 * Parse bulk input for relationships
 * Supports formats: from,to,type or from:to:type
 */
export function parseBulkRelationshipInput (
  input: string,
  nodes: Array<{ id: string; label: string }>
): ParsedRelationship[] {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const relationships: ParsedRelationship[] = []
  
  // Check if first line looks like a CSV header
  let startIndex = 0
  const firstLine = lines[0]?.toLowerCase()
  if (firstLine && (firstLine.includes('from') || firstLine.includes('to') || firstLine.includes('type'))) {
    startIndex = 1
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    
    // Try CSV format (from,to,type or from:to:type)
    if (line.includes(',') || line.includes(':')) {
      const separator = line.includes(',') ? ',' : ':'
      const parts = line.split(separator).map(p => p.trim().replace(/^"|"$/g, ''))
      
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        // Find nodes by label or ID
        const fromNode = nodes.find(n => n.label.toLowerCase() === parts[0].toLowerCase() || n.id === parts[0])
        const toNode = nodes.find(n => n.label.toLowerCase() === parts[1].toLowerCase() || n.id === parts[1])
        
        if (fromNode && toNode) {
          relationships.push({
            from: fromNode.id,
            to: toNode.id,
            type: parts[2]
          })
        }
      }
    }
  }
  
  return relationships
}

/**
 * Generate CSV template for nodes
 */
export function generateNodeTemplate (): string {
  return `label,type,group
Person,Entity,Core Entities
Company,Entity,Core Entities
Product,Entity,Products
Order,Entity,Orders
Customer,Entity,Core Entities`
}

/**
 * Generate CSV template for relationships
 */
export function generateRelationshipTemplate (): string {
  return `from,to,type
Person,Company,WORKS_AT
Company,Product,PRODUCES
Person,Product,BUYS
Order,Customer,PLACED_BY`
}

