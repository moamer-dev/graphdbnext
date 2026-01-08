import { DOMParser } from '@xmldom/xmldom'

export interface XmlElementInfo {
  elementNames: string[]
  attributeNames: string[]
  rootElements: string[]
}

/**
 * Lightweight XML parser that extracts element names and attributes
 * without doing full analysis. Used for populating dropdowns in rules configurator.
 */
export async function extractXmlElements (file: File): Promise<XmlElementInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string
        if (!xmlText) {
          reject(new Error('Failed to read file'))
          return
        }
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(xmlText, 'text/xml')
        
        // Check for parsing errors
        const parseError = doc.getElementsByTagName('parsererror')[0]
        if (parseError) {
          const errorText = parseError.textContent || 'Invalid XML format'
          console.error('XML parsing error:', errorText)
          reject(new Error(`Invalid XML format: ${errorText}`))
          return
        }
        
        // Debug: Check if document was parsed
        if (!doc || !doc.documentElement) {
          console.error('XML document has no root element')
          reject(new Error('XML document has no root element'))
          return
        }
        
        const elementNames = new Set<string>()
        const attributeNames = new Set<string>()
        const rootElements = new Set<string>()
        
        // Get root element
        const root = doc.documentElement
        if (!root) {
          reject(new Error('No root element found in XML'))
          return
        }
        
        rootElements.add(root.nodeName)
        
        // Recursively extract all elements and attributes
        function traverse (node: Node) {
          if (node.nodeType === 1) { // ELEMENT_NODE
            const element = node as Element
            const elementName = element.nodeName
            elementNames.add(elementName)
            
            // Extract attributes
            if (element.attributes && element.attributes.length > 0) {
              for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i]
                if (attr && attr.name) {
                  attributeNames.add(attr.name)
                }
              }
            }
            
            // Traverse children
            if (element.childNodes && element.childNodes.length > 0) {
              for (let i = 0; i < element.childNodes.length; i++) {
                traverse(element.childNodes[i])
              }
            }
          }
        }
        
        // Start traversal from root element, not document
        traverse(root)
        
        resolve({
          elementNames: Array.from(elementNames).sort(),
          attributeNames: Array.from(attributeNames).sort(),
          rootElements: Array.from(rootElements)
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

