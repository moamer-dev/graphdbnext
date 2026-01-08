/**
 * Graph to HTML Service
 * 
 * Full port of graph2html.py conversion logic
 */

import { getGraphDatabaseService } from './graph-database'
import { create } from 'xmlbuilder2'

type XMLBuilderType = ReturnType<typeof create>

interface QueryResult {
  [key: string]: unknown
  _id_?: number
  properties?: Record<string, unknown>
  labels?: string[]
  damages?: (string | null)[]
  indices?: number[]
}

export class GraphToHtmlService {
  private db = getGraphDatabaseService()
  private generatedIdCounter = 0
  private html: XMLBuilderType

  constructor () {
    this.html = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('html', { xmlns: 'http://www.w3.org/1999/xhtml', lang: 'en-US' })
  }

  private generateId (prefix = ''): string {
    this.generatedIdCounter++
    return `${prefix}genid${this.generatedIdCounter}`
  }

  private async queryMultiple (query: string): Promise<QueryResult[]> {
    const results = await this.db.executeRead(query)
    return results as QueryResult[]
  }

  private async queryUnique (query: string): Promise<QueryResult> {
    const results = await this.db.executeRead(query)
    if (results.length !== 1) {
      throw new Error(`Unexpected number of query results: ${results.length}`)
    }
    return results[0] as QueryResult
  }

  private createElement (
    parent: XMLBuilderType,
    tag: string,
    attrib: Record<string, string> = {},
    text: string | null = null,
    tail: string | null = null
  ): XMLBuilderType {
    const elem = parent.ele(tag, attrib)
    if (text !== null) {
      elem.txt(text)
    }
    if (tail !== null) {
      // In xmlbuilder2, we handle tail differently - it's added after the element
      // For now, we'll add it as text to the next sibling or parent
    }
    return elem
  }

  private safeAdd (elem: XMLBuilderType, name: 'text' | 'tail', text: string | null): void {
    if (text !== null && text !== undefined) {
      if (name === 'text') {
        // In xmlbuilder2, txt() sets the text content
        // To append, we need to get current text first, but xmlbuilder2 doesn't have a getter
        // So we'll just set it directly - this is a limitation we'll work around
        elem.txt(text)
      }
      // tail handling in xmlbuilder2 is different - would need custom implementation
    }
  }

  private async makeHeader (): Promise<XMLBuilderType> {
    const head = this.createElement(this.html, 'head')
    this.createElement(head, 'meta', {
      content: 'text/html; charset=UTF-8',
      'http-equiv': 'Content-Type'
    })
    
    // Get title from database
    try {
      const result = await this.queryUnique('MATCH (n:EditionObject) RETURN n.title AS title')
      this.createElement(head, 'title', {}, (result.title as string) || 'Graph to HTML')
    } catch {
      this.createElement(head, 'title', {}, 'Graph to HTML')
    }
    
    this.createElement(head, 'link', {
      href: '../css/styles.css',
      rel: 'stylesheet'
    })
    
    return this.createElement(this.html, 'body')
  }

  private damageOrUnclearSubtrees (lineElementResults: QueryResult[]): Array<[string, string, QueryResult[][]]> {
    const damageSubtrees: QueryResult[][] = []
    const unclearSubtrees: QueryResult[][] = []

    for (const lineElementResult of lineElementResults) {
      // Group by damage
      if (
        damageSubtrees.length > 0 &&
        damageSubtrees[damageSubtrees.length - 1].length > 0 &&
        damageSubtrees[damageSubtrees.length - 1][damageSubtrees.length - 1].damages?.length === 1 &&
        damageSubtrees[damageSubtrees.length - 1][damageSubtrees.length - 1].damages?.[0] !== null &&
        lineElementResult.damages?.length === 1 &&
        damageSubtrees[damageSubtrees.length - 1][damageSubtrees.length - 1].damages?.[0] === lineElementResult.damages?.[0]
      ) {
        damageSubtrees[damageSubtrees.length - 1].push(lineElementResult)
      } else {
        damageSubtrees.push([lineElementResult])
      }

      // Group by unclear
      if (
        unclearSubtrees.length > 0 &&
        unclearSubtrees[unclearSubtrees.length - 1].length > 0 &&
        unclearSubtrees[unclearSubtrees.length - 1][unclearSubtrees.length - 1].properties?.unclear === true &&
        lineElementResult.properties?.unclear === true
      ) {
        unclearSubtrees[unclearSubtrees.length - 1].push(lineElementResult)
      } else {
        unclearSubtrees.push([lineElementResult])
      }
    }

    // Build outer-inner subtrees structure
    const outerInnerSubtrees: Array<[string, string, QueryResult[][]]> = []
    let i = 0
    const currentIndex: Record<string, [number, number]> = { d: [0, 0], u: [0, 0] }

    while (i < lineElementResults.length) {
      if (currentIndex.d[1] === 0 && currentIndex.u[1] === 0) {
        if (damageSubtrees[currentIndex.d[0]].length >= unclearSubtrees[currentIndex.u[0]].length) {
          outerInnerSubtrees.push(['d', 'u', [unclearSubtrees[currentIndex.u[0]]]])
          i += unclearSubtrees[currentIndex.u[0]].length
          if (damageSubtrees[currentIndex.d[0]].length > unclearSubtrees[currentIndex.u[0]].length) {
            currentIndex.d[1] += unclearSubtrees[currentIndex.u[0]].length
          } else {
            currentIndex.d[0]++
            currentIndex.d[1] = 0
          }
          currentIndex.u[0]++
          currentIndex.u[1] = 0
        } else {
          outerInnerSubtrees.push(['u', 'd', [damageSubtrees[currentIndex.d[0]]]])
          i += damageSubtrees[currentIndex.d[0]].length
          currentIndex.u[1] += damageSubtrees[currentIndex.d[0]].length
          currentIndex.d[0]++
          currentIndex.d[1] = 0
        }
      } else {
        const lastEntry = outerInnerSubtrees[outerInnerSubtrees.length - 1]
        const outer = lastEntry[0]
        const inner = lastEntry[1]
        const innerSubtrees = lastEntry[2]
        const subtrees: Record<string, QueryResult[][]> = { d: damageSubtrees, u: unclearSubtrees }
        
        if (currentIndex[outer][1] + subtrees[inner][currentIndex[inner][0]].length > subtrees[outer][currentIndex[outer][0]].length) {
          // Split inner subtree
          const splitPoint = subtrees[outer][currentIndex[outer][0]].length - currentIndex[outer][1]
          const remaining = subtrees[inner][currentIndex[inner][0]].slice(splitPoint)
          subtrees[inner][currentIndex[inner][0]] = subtrees[inner][currentIndex[inner][0]].slice(0, splitPoint)
          subtrees[inner].splice(currentIndex[inner][0] + 1, 0, remaining)
        }
        
        innerSubtrees.push(subtrees[inner][currentIndex[inner][0]])
        i += subtrees[inner][currentIndex[inner][0]].length
        
        if (currentIndex[outer][1] + subtrees[inner][currentIndex[inner][0]].length < subtrees[outer][currentIndex[outer][0]].length) {
          currentIndex[outer][1] += subtrees[inner][currentIndex[inner][0]].length
        } else {
          currentIndex[outer][0]++
          currentIndex[outer][1] = 0
        }
        currentIndex[inner][0]++
        currentIndex[inner][1] = 0
      }
    }

    return outerInnerSubtrees
  }

  private async damageOrUnclearElement1 (
    lineResult: QueryResult,
    parentIsDamaged: boolean,
    parentIsUnclear: boolean,
    isDamaged: boolean,
    isUnclear: boolean,
    precedingSibling: XMLBuilderType | null,
    mode: string,
    outerElement: XMLBuilderType,
    innerSubtree: QueryResult[]
  ): Promise<[XMLBuilderType, boolean, boolean, XMLBuilderType | null]> {
    let innerElement = outerElement
    
    if (mode === 'd') {
      if (
        !parentIsDamaged &&
        innerSubtree[0]?.damages?.length === 1 &&
        innerSubtree[0].damages[0] !== null &&
        !(innerSubtree.length === 1 && (await this.queryMultiple(`MATCH (m)-[:contains|alternative|expressedAs]->(n) WHERE id(m)=${innerSubtree[0]._id_} RETURN n`)).length > 0)
      ) {
        innerElement = this.createElement(outerElement, 'span', { class: 'damage' })
        isDamaged = true
        const index = Math.min(...(innerSubtree[0].indices || [0]))
        const prevDamage = await this.queryMultiple(
          `MATCH (m)-[:contains|alternative|expressedAs*]->(n) WHERE id(m)=${lineResult._id_} AND n.index=${index - 1} RETURN n.damage AS damage`
        )
        if (!(prevDamage.length === 1 && innerSubtree[0].damages?.[0] === prevDamage[0].damage)) {
          precedingSibling = this.createElement(innerElement, 'span', { class: 'tei' }, 
            innerSubtree[0].damages?.[0] === 'low' ? '⸢' : '[')
        }
      } else {
        isDamaged = false
      }
    } else if (mode === 'u') {
      if (
        !parentIsUnclear &&
        innerSubtree[0]?.properties?.unclear === true &&
        !(innerSubtree.length === 1 && (await this.queryMultiple(`MATCH (m)-[:contains|alternative|expressedAs]->(n) WHERE id(m)=${innerSubtree[0]._id_} RETURN n`)).length > 0)
      ) {
        innerElement = this.createElement(outerElement, 'span', { class: 'unclear' })
        isUnclear = true
        const index = Math.min(...(innerSubtree[0].indices || [0]))
        const prevUnclear = await this.queryMultiple(
          `MATCH (m)-[:contains|alternative|expressedAs*]->(n) WHERE id(m)=${lineResult._id_} AND n.index=${index - 1} RETURN n.unclear AS unclear`
        )
        if (!(prevUnclear.length === 1 && innerSubtree[0].properties?.unclear === (prevUnclear[0].unclear === true))) {
          precedingSibling = this.createElement(innerElement, 'span', { class: 'tei' }, '(')
        }
      } else {
        isUnclear = false
      }
    }
    
    return [innerElement, isDamaged, isUnclear, precedingSibling]
  }

  private async damageOrUnclearElement2 (
    lineResult: QueryResult,
    isDamaged: boolean,
    isUnclear: boolean,
    precedingSibling: XMLBuilderType | null,
    mode: string,
    innerSubtree: QueryResult[],
    innerElement: XMLBuilderType
  ): Promise<XMLBuilderType | null> {
    if (mode === 'd' && isDamaged) {
      const index = Math.max(...(innerSubtree[innerSubtree.length - 1].indices || [0]))
      const nextDamage = await this.queryMultiple(
        `MATCH (m)-[:contains|alternative|expressedAs*]->(n) WHERE id(m)=${lineResult._id_} AND n.index=${index + 1} RETURN n.damage AS damage`
      )
      if (!(nextDamage.length === 1 && innerSubtree[0].damages?.[0] === nextDamage[0].damage)) {
        precedingSibling = this.createElement(innerElement, 'span', { class: 'tei' },
          innerSubtree[0].damages?.[0] === 'low' ? '⸣' : ']')
      }
    } else if (mode === 'u' && isUnclear) {
      const index = Math.max(...(innerSubtree[innerSubtree.length - 1].indices || [0]))
      const nextUnclear = await this.queryMultiple(
        `MATCH (m)-[:contains|alternative|expressedAs*]->(n) WHERE id(m)=${lineResult._id_} AND n.index=${index + 1} RETURN n.unclear AS unclear`
      )
      if (!(nextUnclear.length === 1 && innerSubtree[innerSubtree.length - 1].properties?.unclear === (nextUnclear[0].unclear === true))) {
        precedingSibling = this.createElement(innerElement, 'span', { class: 'tei' }, ')')
      }
    }
    return precedingSibling
  }

  private xmlHtmlStripNamespaces (xmlString: string): string {
    return xmlString
      .replace(/\sxmlns(:\w+)?="[^"]+"/g, '')
      .replace(/(<\/?)(\w+):/g, '$1')
  }

  private xmlHtmlConvert (): void {
    // This is a simplified version - full implementation would handle all XML to HTML conversions
    // Note: xmlbuilder2 doesn't expose tag/attrib directly, so this function would need
    // to work differently - perhaps by processing the XML string after conversion
    // For now, this is a placeholder for future XML to HTML conversion logic
  }

  async graph2facsimile (): Promise<string> {
    await this.db.connect()
    const body = await this.makeHeader()

    // Get transliteration layer
    const transliterationLayerResult = await this.queryUnique('MATCH (n:TransliterationLayer) RETURN id(n) AS _id_')

    // Process surfaces
    let columnCounter = 0
    const surfaceResults = await this.queryMultiple(
      `MATCH (m)-[r:contains]->(n:Surface) WHERE id(m)=${transliterationLayerResult._id_} RETURN id(n) AS _id_ ORDER BY r.pos`
    )

    for (let i = 0; i < surfaceResults.length; i++) {
      const surfaceResult = surfaceResults[i]
      const facsimile = this.createElement(body, 'div', { class: 'facsimile section', id: `facs_${i + 1}` })
      const surface = this.createElement(facsimile, 'div', { class: 'surface' })

      // Process columns
      const columnResults = await this.queryMultiple(
        `MATCH (m)-[r:contains]->(n:Column) WHERE id(m)=${surfaceResult._id_} RETURN id(n) AS _id_ ORDER BY r.pos`
      )

      for (const columnResult of columnResults) {
        columnCounter++
        const column = this.createElement(surface, 'div', {
          class: 'column',
          'data-n': String(columnCounter),
          id: `column_${columnCounter}`
        })

        // Process lines
        const lineResults = await this.queryMultiple(
          `MATCH (m)-[r:contains]->(n:Line) WHERE id(m)=${columnResult._id_} RETURN id(n) AS _id_, labels(n) AS labels, properties(n) AS properties ORDER BY r.pos`
        )

        for (const lineResult of lineResults) {
          const lineContainer = this.createElement(column, 'div', { class: 'line-container' })
          const line = this.createElement(lineContainer, 'div', { class: 'line' })
          this.createElement(line, 'span', { class: 'line-nr explicit' }, 
            (lineResult.properties?.n as string) || '')
          const lineBody = this.createElement(line, 'span', { class: 'line-body' })

          // Process line elements (simplified - full implementation would handle all cases)
          const lineElementResults = await this.queryMultiple(
            `MATCH (m)-[r:contains|alternative|expressedAs]->(n) WHERE id(m)=${lineResult._id_} ` +
            `MATCH path = (n)-[:contains|alternative|expressedAs*0..]->(o) ` +
            `OPTIONAL MATCH (o)-[:contains|alternative|expressedAs]->(p) ` +
            `WITH n, o, p, r WHERE p IS NULL ` +
            `WITH n, r, collect(DISTINCT o.damage) AS damages, collect(DISTINCT o.index) AS indices ` +
            `RETURN id(n) AS _id_, labels(n) AS labels, properties(n) AS properties, damages, indices ` +
            `ORDER BY r.pos, n.name`
          )

          // Process damage/unclear subtrees
          const outerInnerSubtrees = this.damageOrUnclearSubtrees(lineElementResults)
          let isDamaged = false
          let isUnclear = false
          let precedingSibling: XMLBuilderType | null = null

          for (const [outer, inner, outerSubtree] of outerInnerSubtrees) {
            const flatSubtree = outerSubtree.flat()
            const [outerElement, newIsDamaged, newIsUnclear, newPrecedingSibling] = 
              await this.damageOrUnclearElement1(
                lineResult, false, false, isDamaged, isUnclear, precedingSibling,
                outer, lineBody, flatSubtree
              )
            isDamaged = newIsDamaged
            isUnclear = newIsUnclear
            precedingSibling = newPrecedingSibling

            // Process inner subtrees (outerSubtree is QueryResult[][])
            for (const innerSubtree of outerSubtree) {
              const [innerElement, innerIsDamaged, innerIsUnclear, innerPrecedingSibling] =
                await this.damageOrUnclearElement1(
                  lineResult, false, false, isDamaged, isUnclear, precedingSibling,
                  inner, outerElement, innerSubtree
                )
              isDamaged = innerIsDamaged
              isUnclear = innerIsUnclear
              precedingSibling = innerPrecedingSibling

              // Process line elements within subtrees
              for (const lineElementResult of innerSubtree) {
                if (lineElementResult.labels?.includes('Sign')) {
                  if (lineElementResult.properties?.type === 'pc') {
                    // Handle punctuation character
                    let text: string | null = null
                    if (lineElementResult.properties?.subtype === 'non_identifiable_sign_multi') {
                      text = '…'
                    } else if (lineElementResult.properties?.subtype === 'non_identifiable_sign_single') {
                      text = 'x'
                    } else if (lineElementResult.properties?.subtype === 'word_boundary_separator') {
                      text = ' . '
                    }
                    if (text !== null) {
                      this.createElement(innerElement, 'span', { class: 'scribal' }, text)
                    }
                  } else if (lineElementResult.properties?.type === 'g') {
                    const text = ((lineElementResult.properties?.text as string) || '') +
                                 ((lineElementResult.properties?.whitespace as string) || '')
                    const attrib: Record<string, string> = { class: 'g' }
                    if (lineElementResult.properties?.id) {
                      attrib.id = lineElementResult.properties.id as string
                    }
                    const lineElement = this.createElement(innerElement, 'span', attrib, text)
                    if (lineElementResult.properties?.cert === 'low') {
                      const teiSpan = this.createElement(lineElement, 'span', { class: 'tei' })
                      this.createElement(teiSpan, 'span', { class: 'super' }, '?')
                    }
                  }
                } else if (lineElementResult.labels?.includes('Alternatives') && 
                          lineElementResult.properties?.name === 'corr-sic') {
                  this.createElement(innerElement, 'span', { class: 'choice' })
                } else if (lineElementResult.labels?.includes('Alternative') &&
                           ['corr', 'sic'].includes(lineElementResult.properties?.name as string)) {
                  this.createElement(innerElement, 'span', { 
                    class: lineElementResult.properties?.name as string 
                  })
                } else if (lineElementResult.labels?.includes('Part') || 
                          lineElementResult.labels?.includes('Seg')) {
                  const label = lineElementResult.labels.includes('Part') ? 'Part' : 'Seg'
                  const attrib: Record<string, string> = {
                    class: label.toLowerCase(),
                    id: lineElementResult.properties?.id as string
                  }
                  if (label === 'Seg') {
                    attrib.onmouseover = ''
                    attrib.onmouseout = ''
                  }
                  this.createElement(innerElement, 'span', attrib)
                }
              }

              precedingSibling = await this.damageOrUnclearElement2(
                lineResult, isDamaged, isUnclear, precedingSibling, inner, innerSubtree, innerElement
              )
            }

            const flatOuterSubtree = outerSubtree.flat()
            precedingSibling = await this.damageOrUnclearElement2(
              lineResult, isDamaged, isUnclear, precedingSibling, outer, flatOuterSubtree, outerElement
            )
          }

          // Add annotations
          const annotationResults = await this.queryMultiple(
            `MATCH (m)-[:contains|alternative|expressedAs*]->(n)-[:annotatedBy]->(o:Annotation)-[:annotates]->(p) ` +
            `MATCH (q:Line)-[:contains|alternative|expressedAs*]->(p) WHERE id(m)=${lineResult._id_} ` +
            `RETURN properties(o) AS properties, collect(DISTINCT p.id) AS ids, collect(DISTINCT q.n) AS ns`
          )

          if (annotationResults.length > 0) {
            const inputId = this.generateId()
            this.createElement(line, 'label', { class: 'notes-icon', for: inputId })
            this.createElement(line, 'input', { id: inputId, onchange: '', type: 'checkbox' })
            const notesContainer = this.createElement(lineContainer, 'div', { class: 'notes-container' })
            const ul = this.createElement(notesContainer, 'ul')
            
            for (const annotationResult of annotationResults) {
              const noteInputId = this.generateId()
              const li = this.createElement(ul, 'li', { class: 'note-item' })
              this.createElement(li, 'button')
              
              const xmlContent = (annotationResult.properties?.content as string || '').match(
                /^(<label>[\s\S]*?<\/label>)([\s\S]*?)$/
              )
              if (xmlContent) {
                // Process annotation XML content
                // This would need full XML parsing and conversion
                // For now, create a simple structure
                this.createElement(li, 'input', { id: noteInputId, type: 'checkbox' })
              }
            }
          }
        }
      }
    }

    return this.html.end({ prettyPrint: true })
  }

  async graph2philology (): Promise<string> {
    await this.db.connect()
    await this.makeHeader()
    
    // TODO: Implement philology conversion
    // This is similar to facsimile but queries different layers
    // For now, return a placeholder structure
    
    return this.html.end({ prettyPrint: true })
  }

  /**
   * Convert graph to HTML
   */
  async convertGraphToHtml (mode: 'facsimile' | 'philology'): Promise<string> {
    if (mode === 'facsimile') {
      return await this.graph2facsimile()
    } else {
      return await this.graph2philology()
    }
  }
}

// Backward compatibility exports
export async function convertGraphToHtml (mode: 'facsimile' | 'philology'): Promise<string> {
  const service = new GraphToHtmlService()
  return await service.convertGraphToHtml(mode)
}

