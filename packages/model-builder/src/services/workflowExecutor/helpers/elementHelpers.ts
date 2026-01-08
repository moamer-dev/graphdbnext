import type { Node as BuilderNode } from '../../../types'

export function getAncestors(element: Element): string[] {
  const ancestors: string[] = []
  let current: Element | null = element.parentElement
  while (current) {
    ancestors.push(current.tagName.toLowerCase())
    current = current.parentElement
  }
  return ancestors
}

export function buildLabelMap(nodes: BuilderNode[]): Map<string, BuilderNode[]> {
  const map = new Map<string, BuilderNode[]>()
  nodes.forEach((n) => {
    const key = (n.label || '').toLowerCase()
    if (!key) return
    const list = map.get(key) || []
    list.push(n)
    map.set(key, list)
  })
  return map
}

export function findElementByTag(doc: Document, tagName: string): Element | null {
  const elements = doc.getElementsByTagName(tagName)
  return elements.length > 0 ? elements[0] : null
}

export function findElementById(doc: Document, id: string): Element | null {
  const byId = doc.getElementById(id)
  if (byId) return byId

  const allElements = doc.getElementsByTagName('*')
  for (let i = 0; i < allElements.length; i++) {
    const elem = allElements[i]
    if (elem.getAttribute('id') === id || 
        elem.getAttribute('xml:id') === id ||
        elem.getAttribute('xmlid') === id) {
      return elem
    }
  }
  return null
}

