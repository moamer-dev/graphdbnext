import type { ParsedElement, GraphElement } from './types'
import { XMLParser } from './parser'
import { ConverterContext } from './context'
import { ElementHelper } from './elementHelper'
import { NodeFactory } from './nodeFactory'
import { RelationFactory } from './relationFactory'
import { TextProcessor } from './textProcessor'
import { GraphWalker } from './graphWalker'

export class XMLToGraphConverter {
  private context: ConverterContext
  private parser: XMLParser
  private elementHelper: ElementHelper
  private relationFactory: RelationFactory
  private nodeFactory: NodeFactory
  private textProcessor: TextProcessor
  private graphWalker: GraphWalker
  private rootElement: ParsedElement

  constructor(xmlContent: string) {
    this.context = new ConverterContext()
    this.parser = new XMLParser()
    this.elementHelper = new ElementHelper()
    this.relationFactory = new RelationFactory(this.context)
    
    this.rootElement = this.parser.parse(xmlContent)
    this.context.allElements = this.parser.getAllElements()
    this.buildParentMapping()

    this.nodeFactory = new NodeFactory(this.context, this.elementHelper, this.relationFactory)
    this.textProcessor = new TextProcessor(
      this.context,
      this.elementHelper,
      (elem, char) => this.nodeFactory.makeSign(elem, char),
      (elem, char) => this.nodeFactory.makeCharacter(elem, char)
    )
    this.graphWalker = new GraphWalker(this.context, this.elementHelper, this.nodeFactory, this.textProcessor)
  }

  private buildParentMapping(): void {
    for (const elem of this.context.allElements) {
      if (elem.parent) {
        this.context.elem2parent.set(elem, elem.parent)
      }
    }
  }

  convert(): GraphElement[] {
    console.log('Starting conversion. Root element:', this.rootElement.tag)
    this.graphWalker.walkThrough(this.rootElement, true)
    console.log('Conversion complete. Generated', this.context.jsonList.length, 'elements')
    return this.context.jsonList
  }
}

export function convertXMLToGraph(xmlContent: string): GraphElement[] {
  const converter = new XMLToGraphConverter(xmlContent)
  return converter.convert()
}

// Type guards
export function isGraphNode(element: GraphElement): element is import('./types').GraphNode {
  return element.type === 'node'
}

export function isGraphRelationship(element: GraphElement): element is import('./types').GraphRelationship {
  return element.type === 'relationship'
}

