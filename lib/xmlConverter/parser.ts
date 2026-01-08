import { DOMParser } from '@xmldom/xmldom'
import type { ParsedElement } from './types'

export class XMLParser {
  private allElements: ParsedElement[] = []

  parse(xmlContent: string): ParsedElement {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const domRoot = doc.documentElement

    console.log('XML Parsed successfully with DOM. Root tag:', domRoot.nodeName)

    const rootElement = this.convertDOMToParsedElement(domRoot, null)
    console.log('Root element created:', rootElement.tag, 'with', rootElement.children.length, 'children')
    console.log('Total elements parsed:', this.allElements.length)

    return rootElement
  }

  getAllElements(): ParsedElement[] {
    return this.allElements
  }

  private convertDOMToParsedElement(node: Element, parent: ParsedElement | null): ParsedElement {
    const tag = node.localName || node.nodeName

    const attrib: Record<string, string> = {}
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      attrib[attr.name] = attr.value
    }

    let text: string | null = null
    const tail: string | null = null

    const childNodes = Array.from(node.childNodes)
    const textParts: string[] = []
    for (const child of childNodes) {
      if (child.nodeType === 3) {
        textParts.push(child.textContent || '')
      } else if (child.nodeType === 1) {
        break
      }
    }
    text = textParts.length > 0 ? textParts.join('') : null

    const elem: ParsedElement = {
      tag,
      attrib,
      text,
      tail,
      children: [],
      parent: parent || undefined
    }

    this.allElements.push(elem)

    const elementChildren: Element[] = []
    for (const child of childNodes) {
      if (child.nodeType === 1) {
        elementChildren.push(child as Element)
      }
    }

    for (let i = 0; i < elementChildren.length; i++) {
      const childElem = elementChildren[i]
      const parsedChild = this.convertDOMToParsedElement(childElem, elem)

      const tailParts: string[] = []
      let nextNode = childElem.nextSibling
      while (nextNode) {
        if (nextNode.nodeType === 3) {
          tailParts.push(nextNode.textContent || '')
        } else if (nextNode.nodeType === 1) {
          break
        }
        nextNode = nextNode.nextSibling
      }
      parsedChild.tail = tailParts.length > 0 ? tailParts.join('') : null

      elem.children.push(parsedChild)
    }

    return elem
  }
}

