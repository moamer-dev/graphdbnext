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

  // Check if it's a context expression (starts with $)
  if (!cleaned.startsWith('$')) {
    return null
  }
  
  // Find the end of the root variable (e.g. $json. or $httpResponse.)
  const contextMatch = cleaned.match(/^\$([a-zA-Z0-9_]+)(\.|$)/)
  if (!contextMatch) {
    return null
  }
  
  const rootKey = contextMatch[1]
  const path = cleaned.substring(rootKey.length + 1).replace(/^\./, '') 
  
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
        // Also support numeric keys as indices (e.g. $json.0.title)
        const index = parseInt(part, 10)
        if (!isNaN(index) && String(index) === part) {
          current = current[index]
        } else {
          return undefined
        }
      } else {
        current = (current as Record<string, unknown>)[part]
      }
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

export function replaceExpressions(template: string, context: JsonPathContext): string {
  // Match {{ $key.path }} or {{ $json[0].path }} patterns
  const regex = /\{\{\s*\$([a-zA-Z0-9_]+)(?:\.?)(\[?[^}]+)\s*\}\}/g
  
  return template.replace(regex, (match, rootKey, pathStr) => {
    // 1. Try resolving using the explicit root key (e.g. $httpResponse)
    if (context[rootKey]) {
      const path = parseJsonPath(`$${rootKey}.${pathStr}`)
      if (path) {
        const value = evaluateJsonPath(context[rootKey], path)
        if (value !== undefined) return formatResult(value, match)
      }
    }
    
    // 2. Fallback for $json: look in all context keys
    if (rootKey === 'json') {
      for (const key in context) {
        const path = parseJsonPath(`$${key}.${pathStr}`)
        if (path) {
          const value = evaluateJsonPath(context[key], path)
          if (value !== undefined) return formatResult(value, match)
        }
      }
    }

    return match
  })
}

function formatResult(value: any, match: string): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Get all available paths from a JSON object
 */
export function getAvailablePaths(data: unknown, prefix = ''): string[] {
  const pathSet = new Set<string>()
  
  function discover(val: unknown, currentPath: string) {
    if (val === null || val === undefined) return
    
    if (currentPath) {
      pathSet.add(currentPath)
    }

    if (Array.isArray(val)) {
      if (!currentPath) pathSet.add('[]')
      val.forEach((item, index) => {
        discover(item, currentPath ? `${currentPath}[${index}]` : `[${index}]`)
      })
    } else if (typeof val === 'object') {
      Object.entries(val).forEach(([key, child]) => {
        discover(child, currentPath ? `${currentPath}.${key}` : key)
      })
    }
  }

  discover(data, prefix)
  return Array.from(pathSet)
}

