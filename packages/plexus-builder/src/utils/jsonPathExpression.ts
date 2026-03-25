/**
 * JSON Path Expression Parser and Evaluator
 * Supports expressions like {{ $json.title }} or {{ $json.labels.ar.value }}
 */

export interface JsonPathContext {
  json: unknown
  [key: string]: unknown
}

/**
 * Parse a JSON path expression like "$json.title" or "$json.labels.ar.value"
 */
export function parseJsonPath(expression: string): string[] | null {
  // Remove template syntax {{ }}
  const cleaned = expression.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim()
  
  // Check if it's a $json expression
  if (!cleaned.startsWith('$json.')) {
    return null
  }
  
  // Extract the path after $json.
  const path = cleaned.substring(6) // Remove "$json."
  
  if (!path) {
    return [''] // Root path
  }
  
  // Split by dots, but handle array indices
  const parts: string[] = []
  let current = ''
  let inBrackets = false
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i]
    
    if (char === '[') {
      if (current) {
        parts.push(current)
        current = ''
      }
      inBrackets = true
      current = ''
    } else if (char === ']') {
      if (inBrackets && current) {
        // Remove quotes if present
        const index = current.replace(/^["']|["']$/g, '')
        parts.push(`[${index}]`)
        current = ''
      }
      inBrackets = false
    } else if (char === '.' && !inBrackets) {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }
  
  if (current) {
    parts.push(current)
  }
  
  return parts.length > 0 ? parts : null
}

/**
 * Evaluate a JSON path expression against a data object
 */
export function evaluateJsonPath(data: unknown, path: string[]): unknown {
  if (path.length === 0) {
    return data
  }
  
  let current: unknown = data
  
  for (const part of path) {
    if (current === null || current === undefined) {
      return undefined
    }
    
    // Handle array indices like "[0]"
    if (part.startsWith('[') && part.endsWith(']')) {
      const indexStr = part.slice(1, -1)
      const index = parseInt(indexStr, 10)
      
      if (!Array.isArray(current) || isNaN(index)) {
        return undefined
      }
      
      current = current[index]
    } else {
      // Handle object properties
      if (typeof current !== 'object' || current === null) {
        return undefined
      }
      
      if (Array.isArray(current)) {
        return undefined
      }
      
      current = (current as Record<string, unknown>)[part]
    }
  }
  
  return current
}

/**
 * Evaluate a template expression like "{{ $json.title }}"
 */
export function evaluateExpression(expression: string, context: JsonPathContext): unknown {
  const path = parseJsonPath(expression)
  
  if (!path) {
    // Not a JSON path expression, return as-is or try to evaluate as literal
    return expression
  }
  
  return evaluateJsonPath(context.json, path)
}

/**
 * Replace all template expressions in a string
 */
export function replaceExpressions(template: string, context: JsonPathContext): string {
  // Match {{ $json.path }} patterns
  const regex = /\{\{\s*\$json\.([^}]+)\s*\}\}/g
  
  return template.replace(regex, (match, pathStr) => {
    const path = parseJsonPath(`$json.${pathStr}`)
    if (!path) {
      return match
    }
    
    const value = evaluateJsonPath(context.json, path)
    
    // Convert value to string
    if (value === null || value === undefined) {
      return ''
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  })
}

/**
 * Get all available paths from a JSON object
 */
export function getAvailablePaths(data: unknown, prefix = ''): string[] {
  const paths: string[] = []
  
  if (data === null || data === undefined) {
    return paths
  }
  
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemPaths = getAvailablePaths(item, `${prefix}[${index}]`)
      paths.push(...itemPaths)
    })
    if (data.length > 0) {
      paths.push(prefix || '[]')
    }
  } else if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key
      paths.push(currentPath)
      
      if (typeof value === 'object' && value !== null) {
        const nestedPaths = getAvailablePaths(value, currentPath)
        paths.push(...nestedPaths)
      }
    })
  }
  
  return paths
}

