import type { ParsedElement } from './types'

export class ElementHelper {
  getTag(elem: ParsedElement): string {
    const tag = elem.tag
    if (tag.includes('}')) {
      return tag.split('}').pop() || tag
    }
    if (tag.includes(':')) {
      return tag.split(':').pop() || tag
    }
    return tag
  }

  getAttrib(elem: ParsedElement | null, keys?: string[]): Record<string, string> {
    const attrib: Record<string, string> = {}
    if (elem) {
      for (const key in elem.attrib) {
        let cleanKey = key.split('}').pop() || key
        if (cleanKey.startsWith('xml:')) {
          cleanKey = cleanKey.substring(4)
        }
        if (!keys || keys.includes(cleanKey)) {
          attrib[cleanKey] = elem.attrib[key]
        }
      }
    }
    return attrib
  }

  getAncestor(elem: ParsedElement, tags: string[], elem2parent: Map<ParsedElement, ParsedElement>, ignoreTags?: string[]): ParsedElement | null {
    let current: ParsedElement | null = elem
    const ignore = ignoreTags || []
    
    // Start by moving up from the current element
    // If current element is in ignore list, skip it and start from parent
    if (current && ignore.includes(this.getTag(current))) {
      current = elem2parent.get(current) || null
    }
    
    // Now traverse up the tree, skipping ignored elements
    while (current) {
      const currentTag = this.getTag(current)
      if (tags.includes(currentTag)) {
        return current
      }
      // Move to parent, but skip ignored elements
      current = elem2parent.get(current) || null
      // Skip ignored elements in the chain
      while (current && ignore.includes(this.getTag(current))) {
        current = elem2parent.get(current) || null
      }
    }
    return null
  }

  removeHashtags(ref: string): string {
    return ref.split(' ').map(r => {
      const hashIndex = r.indexOf('#')
      return hashIndex >= 0 ? r.substring(hashIndex + 1) : r
    }).join(' ')
  }

  transferItem(source: Record<string, string>, sourceKey: string, target: Record<string, unknown>, targetKey: string): void {
    if (sourceKey in source) {
      target[targetKey] = source[sourceKey]
    }
  }

  getXmlContent(elem: ParsedElement): string {
    const parts: string[] = []

    if (elem.text) {
      parts.push(elem.text)
    }

    for (const child of elem.children) {
      const attrs = Object.entries(child.attrib)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
        .join(' ')
      const attrStr = attrs ? ` ${attrs}` : ''
      const childContent = this.getXmlContent(child)
      parts.push(`<${child.tag}${attrStr}>${childContent}</${child.tag}>`)
    }

    return parts.join('')
  }

  findElementById(id: string, allElements: ParsedElement[]): ParsedElement | null {
    const cleanId = this.removeHashtags(id).split(' ')[0]

    for (const elem of allElements) {
      const attribs = this.getAttrib(elem)
      if (attribs.id === cleanId) {
        return elem
      }

      for (const key in elem.attrib) {
        const cleanKey = key.split('}').pop() || key
        if ((cleanKey === 'id' || cleanKey === 'xml:id' || cleanKey === 'xmlid') &&
            elem.attrib[key] === cleanId) {
          return elem
        }
        if (key === '{http://www.w3.org/XML/1998/namespace}id' && elem.attrib[key] === cleanId) {
          return elem
        }
      }
    }

    return null
  }

  findElementByXPath(xpath: string, allElements: ParsedElement[]): ParsedElement | null {
    if (xpath.includes('[@')) {
      const match = xpath.match(/\.\/\/\*\[@([^=]+)='([^']+)'\]/)
      if (match) {
        const attr = match[1].split('}').pop() || match[1]
        const value = match[2]
        for (const elem of allElements) {
          if (this.getAttrib(elem)[attr] === value) {
            return elem
          }
        }
      }
    }
    return null
  }

  findAllDescendants(elem: ParsedElement, tagName?: string): ParsedElement[] {
    const result: ParsedElement[] = []
    const stack: ParsedElement[] = [...elem.children]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (!tagName || this.getTag(current) === tagName) {
        result.push(current)
      }
      stack.push(...current.children)
    }

    return result
  }
}

