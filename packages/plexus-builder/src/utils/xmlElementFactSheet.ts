import { DOMParser } from '@xmldom/xmldom'
import { type XmlAnalysisRules } from '../services/xml/xmlAnalyzer'

export interface ElementFactSheet {
  elementName: string
  attributes: Array<{ name: string; value: string }>
  children: Array<{ name: string; count: number }>
  parent: string | null
  ancestors: string[]
  textContent: string | null
  hasTextContent: boolean
  isArrayItem: boolean
  arrayIndex?: number
}

/**
 * Extract fact sheet information for an element from XML based on its path in the JSON tree
 */
export function getElementFactSheet (
  xmlString: string,
  nodePath: string,
  nodeKey: string,
  analysisRules?: Partial<XmlAnalysisRules>
): ElementFactSheet | null {
  const ignoredElements = new Set((analysisRules?.ignoredElements || []).map(e => e.toLowerCase()))
  const ignoredSubtrees = new Set((analysisRules?.ignoredSubtrees || []).map(e => e.toLowerCase()))
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')

    // Check for parsing errors
    const parseError = doc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      return null
    }

    // Skip if this is an attribute or text node
    if (nodeKey.startsWith('_') || nodeKey === '__text') {
      return null
    }

    // Find the element in the XML based on the path
    const element = findElementByPath(doc.documentElement, nodePath, nodeKey)
    if (!element) {
      console.warn('Element not found:', { nodePath, nodeKey })
      return null
    }

    // Extract attributes
    const attributes: Array<{ name: string; value: string }> = []
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        attributes.push({
          name: attr.name,
          value: attr.value
        })
      }
    }

    // Extract children (grouped by name, respecting ignored elements)
    const childrenMap = new Map<string, number>()
    
    if (!ignoredSubtrees.has(nodeKey.toLowerCase())) {
      const processChildren = (nodes: NodeList) => {
        const childElements = Array.from(nodes).filter(
          (node) => node.nodeType === 1
        ) as Element[]
        
        childElements.forEach((child) => {
          const tagName = cleanName(child.tagName)
          const tagNameLower = tagName.toLowerCase()
          
          if (ignoredElements.has(tagNameLower)) {
            if (!ignoredSubtrees.has(tagNameLower)) {
              processChildren(child.childNodes)
            }
            return
          }
          
          childrenMap.set(tagName, (childrenMap.get(tagName) || 0) + 1)
        })
      }
      
      processChildren(element.childNodes)
    }

    const children = Array.from(childrenMap.entries()).map(([name, count]) => ({
      name,
      count
    }))

    // Extract parent
    const parent = element.parentNode && element.parentNode.nodeType === 1
      ? cleanName((element.parentNode as Element).tagName)
      : null

    // Extract ancestors
    const ancestors: string[] = []
    let current = element.parentNode
    while (current && current.nodeType === 1) {
      const ancestorName = cleanName((current as Element).tagName)
      if (ancestorName && ancestorName !== parent) {
        ancestors.unshift(ancestorName)
      }
      current = current.parentNode
    }

    // Extract text content
    const textNodes = Array.from(element.childNodes).filter(
      (node) => node.nodeType === 3
    ) as Text[]
    const textContent = textNodes
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .join(' ') || null

    // Check if this is an array item
    const isArrayItem = /\[\d+\]$/.test(nodePath)
    const arrayIndex = isArrayItem
      ? parseInt(nodePath.match(/\[(\d+)\]$/)?.[1] || '0', 10)
      : undefined

    return {
      elementName: cleanName(element.tagName),
      attributes,
      children,
      parent,
      ancestors,
      textContent,
      hasTextContent: textContent !== null && textContent.length > 0,
      isArrayItem,
      arrayIndex
    }
  } catch (error) {
    console.error('Error extracting element fact sheet:', error)
    return null
  }
}

/**
 * Helper to find an element anywhere in the XML tree matching targetName (case-insensitive)
 */
function findAnyElementByName (root: Element, targetName: string): Element | null {
  if (cleanName(root.tagName).toLowerCase() === targetName.toLowerCase()) {
    return root
  }
  const doc = root.ownerDocument || (root as any)
  if (doc && typeof doc.getElementsByTagName === 'function') {
    const allElements = Array.from(doc.getElementsByTagName('*')) as Element[]
    const found = allElements.find(
      (el) => cleanName(el.tagName).toLowerCase() === targetName.toLowerCase()
    )
    if (found) return found
  }
  const children = Array.from(root.childNodes).filter(
    (node) => node.nodeType === 1
  ) as Element[]
  for (const child of children) {
    const res = findAnyElementByName(child, targetName)
    if (res) return res
  }
  return null
}

/**
 * Find an element in the XML tree based on the JSON tree path
 */
function findElementByPath (
  root: Element,
  nodePath: string,
  nodeKey: string
): Element | null {
  try {
    // Check if root matches
    if (cleanName(root.tagName).toLowerCase() === nodeKey.toLowerCase() && (nodePath === nodeKey || nodePath === '')) {
      return root
    }

    const pathStr = nodePath.replace(/^\./, '') // Remove leading dot
    
    // If path is empty or just the key, search root and all descendants
    if (!pathStr || pathStr === nodeKey) {
      return findAnyElementByName(root, nodeKey)
    }

    // Parse the path - handle both dot notation and array indices
    // Example: "edxml.header.title" or "edxml.facsimile[0].surface"
    const parts: Array<{ name: string; index?: number }> = []
    const segments = pathStr.split('.')
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/)
      if (arrayMatch) {
        parts.push({ name: arrayMatch[1], index: parseInt(arrayMatch[2], 10) })
      } else if (/^\d+$/.test(segment)) {
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1]
          if (lastPart.index === undefined) {
            lastPart.index = parseInt(segment, 10)
          } else {
            parts.push({ name: '', index: parseInt(segment, 10) })
          }
        } else {
          parts.push({ name: '', index: parseInt(segment, 10) })
        }
      } else if (!segment.startsWith('_') && segment !== '__text') {
        parts.push({ name: segment })
      }
    }
    
    if (parts.length === 0) {
      return findAnyElementByName(root, nodeKey)
    }
    
    // Navigate through the XML tree
    let current: Element | null = root
    
    let startIndex = 0
    if (parts[0] && cleanName(root.tagName).toLowerCase() === parts[0].name.toLowerCase()) {
      startIndex = 1
      if (parts.length === 1) {
        return root
      }
    }
    
    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i]
      if (!current) {
        break
      }
      
      const children = Array.from(current.childNodes).filter(
        (node) => node.nodeType === 1
      ) as Element[]
      
      if (!part.name && part.index !== undefined) {
        if (part.index >= children.length) {
          current = null
          break
        }
        current = children[part.index]
      } else {
        const matching = children.filter((child) => {
          const tagName = cleanName(child.tagName)
          return tagName.toLowerCase() === part.name.toLowerCase()
        })
        
        if (matching.length === 0) {
          current = null
          break
        }
        
        if (part.index !== undefined) {
          if (part.index >= matching.length) {
            current = null
            break
          }
          current = matching[part.index]
        } else {
          current = matching[0]
        }
      }
    }
    
    if (current && cleanName(current.tagName).toLowerCase() === nodeKey.toLowerCase()) {
      return current
    }

    if (current) {
      const children = Array.from(current.childNodes).filter(
        (node) => node.nodeType === 1
      ) as Element[]
      
      const nodeKeyAsIndex = parseInt(nodeKey, 10)
      if (!isNaN(nodeKeyAsIndex) && nodeKeyAsIndex >= 0) {
        if (nodeKeyAsIndex < children.length) {
          return children[nodeKeyAsIndex]
        }
      }
      
      const matching = children.find((child) => {
        const tagName = cleanName(child.tagName)
        return tagName.toLowerCase() === nodeKey.toLowerCase()
      })
      
      if (matching) {
        return matching
      }
    }
    
    return findAnyElementByName(root, nodeKey)
  } catch (error) {
    console.error('Error in findElementByPath:', error, { nodePath, nodeKey })
    return findAnyElementByName(root, nodeKey)
  }
}

function cleanName (name: string): string {
  // Remove namespace prefix if present
  if (name.includes('}')) {
    return name.split('}').pop() || name
  }
  if (name.includes(':')) {
    return name.split(':').pop() || name
  }
  return name
}

/**
 * Find the character position (offset) of an element's opening tag in the XML string
 * Uses element ID (xml:id or id attribute) for precise matching
 */
export function findElementPosition (
  xmlString: string,
  nodePath: string,
  nodeKey: string
): number | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')

    // Check for parsing errors
    const parseError = doc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      console.warn('XML parsing error')
      return null
    }

    // Skip if this is an attribute or text node
    if (nodeKey.startsWith('_') || nodeKey === '__text') {
      return null
    }

    // Find the element in the XML using the same logic as findElementByPath
    const element = findElementByPath(doc.documentElement, nodePath, nodeKey)
    if (!element) {
      console.warn('Element not found for path:', nodePath, nodeKey)
      return null
    }

    console.log('Found element:', element.tagName, 'at path:', nodePath, 'key:', nodeKey)

    // Try to find element by ID (xml:id or id attribute) - simple string search
    const elementId = element.getAttribute('xml:id') || element.getAttribute('id')
    
    if (elementId) {
      console.log('Element has ID:', elementId)
      
      // Escape special regex characters in the ID
      const escapedId = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      // Use regex to find the exact attribute match
      // Match xml:id="id" or id="id" (with double or single quotes)
      // Ensure it's a complete attribute, not part of another attribute value
      const idRegex = new RegExp(
        `(?:xml:id|id)\\s*=\\s*["']${escapedId}["']`,
        'g'
      )
      
      let bestMatch: { position: number, tagStart: number } | null = null
      let match
      
      while ((match = idRegex.exec(xmlString)) !== null) {
        const attrIndex = match.index
        
        // Verify this is not inside another attribute value
        // Check backwards to see if we're inside quotes
        let inQuotes = false
        let quoteChar = ''
        for (let i = attrIndex - 1; i >= 0; i--) {
          const char = xmlString[i]
          if (char === '"' || char === "'") {
            if (!inQuotes) {
              inQuotes = true
              quoteChar = char
            } else if (char === quoteChar) {
              inQuotes = false
              break
            }
          }
          if (char === '<') {
            break
          }
        }
        
        if (!inQuotes) {
          // Found a valid attribute match, now find the opening < of the tag
          let tagStart = attrIndex
          while (tagStart > 0 && xmlString[tagStart] !== '<') {
            tagStart--
          }
          
          if (tagStart >= 0 && xmlString[tagStart] === '<') {
            // Check if this tag matches our element's tag name
            const tagEnd = xmlString.indexOf('>', tagStart)
            if (tagEnd !== -1) {
              const tagContent = xmlString.substring(tagStart + 1, tagEnd)
              const tagNameMatch = tagContent.match(/^(\S+)/)
              if (tagNameMatch && tagNameMatch[1] === element.tagName) {
                bestMatch = { position: tagStart, tagStart }
                break // Found exact match, use it
              }
            }
          }
        }
      }
      
      if (bestMatch) {
        return bestMatch.position
      }
      
      console.warn('Could not find element by ID, falling back to index method')
    } else {
      console.log('Element has no ID attribute, using index method')
    }

    // Fallback: use index-based approach if no ID
    const tagName = element.tagName
    const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Get all elements with the same tag name in document order
    const allElements = doc.getElementsByTagName(tagName)
    let targetIndex = -1
    for (let i = 0; i < allElements.length; i++) {
      if (allElements[i] === element) {
        targetIndex = i
        break
      }
    }
    
    if (targetIndex === -1) {
      console.warn('Could not find element index')
      return null
    }
    
    console.log('Target element index:', targetIndex, 'out of', allElements.length)
    
    // Find all occurrences of this tag in the XML string
    const regex = new RegExp(`<${escapedTag}(?:\\s[^>]*)?>`, 'gi')
    const matches: number[] = []
    let match
    while ((match = regex.exec(xmlString)) !== null) {
      matches.push(match.index)
    }
    
    console.log('Found', matches.length, 'matches for tag', tagName)
    
    if (targetIndex < matches.length) {
      const position = matches[targetIndex]
      console.log('Returning position:', position)
      return position
    }
    
    // Fallback to first match
    if (matches.length > 0) {
      console.warn('Index out of bounds, using first match')
      return matches[0]
    }

    console.warn('No matches found')
    return null
  } catch (error) {
    console.error('Error in findElementPosition:', error, { nodePath, nodeKey })
    return null
  }
}

