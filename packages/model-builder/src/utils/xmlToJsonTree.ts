import { DOMParser } from '@xmldom/xmldom'
import type { XmlAnalysisRules } from '../services/xmlAnalyzer'

export interface JsonTreeNode {
  key: string
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  children?: JsonTreeNode[]
  isExpanded?: boolean
  // Location data for reliable XML navigation
  location?: {
    xmlId?: string // xml:id attribute value
    id?: string // id attribute value
    tagName: string // Element tag name
    charPosition?: number // Character position in original XML string
  }
}

/**
 * Convert XML to JSON tree structure similar to jsonformatter.org/xml-viewer
 * Attributes are prefixed with '_', text content is shown as '__text'
 * Respects ignored elements and ignored subtrees from analysis rules
 * Includes location data (xml:id, id, charPosition) for reliable XML navigation
 */
export function xmlToJsonTree (
  xmlString: string,
  analysisRules?: Partial<XmlAnalysisRules>
): JsonTreeNode | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')

    // Check for parsing errors
    const parseError = doc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      return null
    }

    const root = doc.documentElement
    if (!root) {
      return null
    }

    // Build sets for quick lookup
    const ignoredElements = new Set(
      (analysisRules?.ignoredElements || []).map(e => e.toLowerCase())
    )
    const ignoredSubtrees = new Set(
      (analysisRules?.ignoredSubtrees || []).map(e => e.toLowerCase())
    )

    return convertElementToNode(root, ignoredElements, ignoredSubtrees, xmlString)
  } catch (error) {
    console.error('Error converting XML to JSON tree:', error)
    return null
  }
}

function convertElementToNode (
  element: Element,
  ignoredElements: Set<string> = new Set(),
  ignoredSubtrees: Set<string> = new Set(),
  xmlString?: string
): JsonTreeNode | null {
  const nodeName = cleanName(element.tagName)
  const nodeNameLower = nodeName.toLowerCase()
  
  // Check if this element should be ignored
  if (ignoredElements.has(nodeNameLower)) {
    // If ignored, check if subtree should also be ignored
    if (ignoredSubtrees.has(nodeNameLower)) {
      // Completely skip this element and its subtree
      return null
    }
    // Element is ignored but subtree is not - process children only
    return processIgnoredElementChildren(element, ignoredElements, ignoredSubtrees, xmlString)
  }

  // Extract location data
  const xmlId = element.getAttribute('xml:id') || element.getAttribute('xmlns:id') || undefined
  const id = element.getAttribute('id') || undefined
  let charPosition: number | undefined
  
  // Calculate character position if xmlString is provided
  if (xmlString && (xmlId || id)) {
    // Use ID-based search for reliability
    const searchId = xmlId || id
    if (searchId) {
      const idPatterns = [
        `xml:id="${searchId}"`,
        `id="${searchId}"`,
        `xml:id='${searchId}'`,
        `id='${searchId}'`
      ]
      
      for (const pattern of idPatterns) {
        const index = xmlString.indexOf(pattern)
        if (index !== -1) {
          // Find the opening < of the tag
          let tagStart = index
          while (tagStart > 0 && xmlString[tagStart] !== '<') {
            tagStart--
          }
          if (tagStart >= 0 && xmlString[tagStart] === '<') {
            charPosition = tagStart
            break
          }
        }
      }
    }
  }

  const result: JsonTreeNode = {
    key: nodeName,
    type: 'object',
    value: {},
    children: [],
    location: {
      xmlId,
      id,
      tagName: nodeName,
      charPosition
    }
  }

  // Add attributes as children with '_' prefix
  const attrs = element.attributes
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    const attrName = cleanName(attr.name)
    result.children!.push({
      key: `_${attrName}`,
      type: 'string',
      value: attr.value,
      isExpanded: false
    })
  }

  // Process child nodes
  const childNodes = Array.from(element.childNodes)
  const elementChildren: Element[] = []
  const textNodes: Text[] = []

  childNodes.forEach((node) => {
    if (node.nodeType === 1) {
      // Element node
      elementChildren.push(node as Element)
    } else if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim()
      if (text) {
        textNodes.push(node as Text)
      }
    }
  })

  // Filter and process children
  const validChildren: Element[] = []
  elementChildren.forEach((child) => {
    const childTagName = cleanName(child.tagName)
    const childTagNameLower = childTagName.toLowerCase()
    
    // Skip if child is in ignored elements list
    if (ignoredElements.has(childTagNameLower)) {
      // If subtree is also ignored, skip completely
      if (ignoredSubtrees.has(childTagNameLower)) {
        return
      }
      // Otherwise, process the child's children (it's ignored but subtree isn't)
      // This is handled in convertElementToNode itself
    }
    
    validChildren.push(child)
  })

  // Group element children by tag name
  const childrenByTag = new Map<string, Element[]>()
  validChildren.forEach((child) => {
    const tagName = cleanName(child.tagName)
    if (!childrenByTag.has(tagName)) {
      childrenByTag.set(tagName, [])
    }
    childrenByTag.get(tagName)!.push(child)
  })

  // Add grouped children
  childrenByTag.forEach((children, tagName) => {
    const convertedChildren = children
      .map(child => convertElementToNode(child, ignoredElements, ignoredSubtrees, xmlString))
      .filter((node): node is JsonTreeNode => node !== null)
    
    if (convertedChildren.length === 0) {
      return
    }
    
    if (convertedChildren.length === 1) {
      // Single child - add as object
      result.children!.push(convertedChildren[0])
    } else {
      // Multiple children with same tag - add as array
      const arrayNode: JsonTreeNode = {
        key: tagName,
        type: 'array',
        value: [],
        children: convertedChildren.map((child, index) => ({
          ...child,
          key: String(index),
          isExpanded: false
        })),
        isExpanded: false
      }
      result.children!.push(arrayNode)
    }
  })

  // Add text content if present
  if (textNodes.length > 0) {
    const textContent = textNodes.map(t => t.textContent).join(' ').trim()
    if (textContent) {
      result.children!.push({
        key: '__text',
        type: 'string',
        value: textContent,
        isExpanded: false
      })
    }
  }

  // Update value to show count
  if (result.children) {
    if (result.type === 'object') {
      result.value = `{${result.children.length}}`
    } else if (result.type === 'array') {
      result.value = `[${result.children.length}]`
    }
  }

  result.isExpanded = false
  return result
}

/**
 * Process children of an ignored element (when element is ignored but subtree is not)
 */
function processIgnoredElementChildren (
  element: Element,
  ignoredElements: Set<string>,
  ignoredSubtrees: Set<string>,
  xmlString?: string
): JsonTreeNode | null {
  const childNodes = Array.from(element.childNodes)
  const elementChildren: Element[] = []
  const textNodes: Text[] = []

  childNodes.forEach((node) => {
    if (node.nodeType === 1) {
      elementChildren.push(node as Element)
    } else if (node.nodeType === 3) {
      const text = node.textContent?.trim()
      if (text) {
        textNodes.push(node as Text)
      }
    }
  })

  // Process all children as if they're at the same level
  const validChildren: Element[] = []
  elementChildren.forEach((child) => {
    const childTagName = cleanName(child.tagName)
    const childTagNameLower = childTagName.toLowerCase()
    
    if (ignoredElements.has(childTagNameLower) && ignoredSubtrees.has(childTagNameLower)) {
      return // Skip completely ignored subtrees
    }
    
    validChildren.push(child)
  })

  if (validChildren.length === 0 && textNodes.length === 0) {
    return null
  }

  // If there's only one child and no text, return it directly
  if (validChildren.length === 1 && textNodes.length === 0) {
    return convertElementToNode(validChildren[0], ignoredElements, ignoredSubtrees, xmlString)
  }

  // Otherwise, create a wrapper node to contain the children
  const result: JsonTreeNode = {
    key: `_ignored_${cleanName(element.tagName)}`,
    type: 'object',
    value: {},
    children: []
  }

  // Group children by tag name
  const childrenByTag = new Map<string, Element[]>()
  validChildren.forEach((child) => {
    const tagName = cleanName(child.tagName)
    if (!childrenByTag.has(tagName)) {
      childrenByTag.set(tagName, [])
    }
    childrenByTag.get(tagName)!.push(child)
  })

  childrenByTag.forEach((children, tagName) => {
    const convertedChildren = children
      .map(child => convertElementToNode(child, ignoredElements, ignoredSubtrees, xmlString))
      .filter((node): node is JsonTreeNode => node !== null)
    
    if (convertedChildren.length === 0) {
      return
    }
    
    if (convertedChildren.length === 1) {
      result.children!.push(convertedChildren[0])
    } else {
      const arrayNode: JsonTreeNode = {
        key: tagName,
        type: 'array',
        value: [],
        children: convertedChildren.map((child, index) => ({
          ...child,
          key: String(index),
          isExpanded: false
        })),
        isExpanded: false
      }
      result.children!.push(arrayNode)
    }
  })

  // Add text content if present
  if (textNodes.length > 0) {
    const textContent = textNodes.map(t => t.textContent).join(' ').trim()
    if (textContent) {
      result.children!.push({
        key: '__text',
        type: 'string',
        value: textContent,
        isExpanded: false
      })
    }
  }

  if (result.children && result.children.length > 0) {
    result.value = `{${result.children.length}}`
    return result
  }

  return null
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

