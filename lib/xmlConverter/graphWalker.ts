import type { ParsedElement } from './types'
import type { ConverterContext } from './context'
import { ElementHelper } from './elementHelper'
import { NodeFactory } from './nodeFactory'
import { TextProcessor } from './textProcessor'

export class GraphWalker {
  constructor(
    private context: ConverterContext,
    private elementHelper: ElementHelper,
    private nodeFactory: NodeFactory,
    private textProcessor: TextProcessor
  ) {}

  walkThrough(elem: ParsedElement, isRoot = true, depth = 0): void {
    if (depth > 10000) {
      console.error('Maximum recursion depth exceeded for element:', elem.tag)
      return
    }

    if (isRoot) {
      console.log('Walking through root element:', elem.tag, 'with', elem.children.length, 'direct children')
      if (elem.children.length > 0) {
        console.log('First few child tags:', elem.children.slice(0, 5).map(c => this.elementHelper.getTag(c)))
      }
      this.textProcessor.processText(elem, elem.text)
    }

    for (const child of elem.children) {
      const childTag = this.elementHelper.getTag(child)

      if (this.context.ignoreElem.includes(childTag)) {
        // Process text inside ignored elements (like damage, unclear)
        // This ensures text like "k" and "r" inside <damage> elements is processed
        this.textProcessor.processText(child, child.text)
        if (!this.context.ignoreSubtree.includes(childTag)) {
          this.walkThrough(child, false, depth + 1)
        }
        this.textProcessor.processText(child, child.tail)
        continue
      } else if (this.context.ignoreTree.includes(childTag)) {
        continue
      } else if (childTag === "choice") {
        this.nodeFactory.makeAlternatives(child)
      } else if (childTag === "column") {
        this.nodeFactory.makeColumn(child)
      } else if (childTag === "corr") {
        this.nodeFactory.makeAlternative(child)
      } else if (childTag === "facsimile") {
        this.nodeFactory.makeTransliterationLayer(child)
      } else if (childTag === "kolon") {
        this.nodeFactory.makeColon(child)
      } else if (childTag === "line") {
        this.nodeFactory.makeLine(child)
      } else if (childTag === "note") {
        this.nodeFactory.makeAnnotation(child)
      } else if (childTag === "part") {
        this.nodeFactory.makePart(child)
      } else if (childTag === "pc") {
        this.nodeFactory.makeSign(child)
      } else if (childTag === "phr") {
        this.nodeFactory.makePhrase(child)
      } else if (childTag === "seg") {
        this.nodeFactory.makeSeg(child)
        // Process text content of seg element to create Sign nodes
        // This handles cases like <seg>l</seg> where "l" should become a Sign
        // Process text BEFORE recursively walking children to maintain order
        this.textProcessor.processText(child, child.text)
        if (!this.context.ignoreSubtree.includes(childTag)) {
          this.walkThrough(child, false, depth + 1)
        }
        this.textProcessor.processText(child, child.tail)
        continue
      } else if (childTag === "sic") {
        this.nodeFactory.makeAlternative(child)
      } else if (childTag === "stanza") {
        this.nodeFactory.makeStanza(child)
      } else if (childTag === "structure") {
        this.nodeFactory.makeVocalisationLayer(child)
      } else if (childTag === "surface") {
        this.nodeFactory.makeSurface(child)
      } else if (childTag === "term") {
        this.nodeFactory.makeAnnotation(child)
      } else if (childTag === "text") {
        this.nodeFactory.makeEditionObject(child)
      } else if (childTag === "translation") {
        this.nodeFactory.makeTranslationUnit(child)
      } else if (childTag === "verse") {
        this.nodeFactory.makeVerse(child)
      } else if (childTag === "w") {
        this.nodeFactory.makeWord(child)
        // Process text content of word element to create Character nodes
        // This handles cases like <w>li</w> where "l" and "i" should become Characters
        // Process text BEFORE recursively walking children to maintain order
        this.textProcessor.processText(child, child.text)
        if (!this.context.ignoreSubtree.includes(childTag)) {
          this.walkThrough(child, false, depth + 1)
        }
        this.textProcessor.processText(child, child.tail)
        continue
      } else {
        if (depth < 3) {
          console.log('Unknown tag encountered:', childTag, 'at depth', depth)
        }
        if (!this.context.ignoreSubtree.includes(childTag)) {
          this.walkThrough(child, false, depth + 1)
        }
        this.textProcessor.processText(child, child.tail)
        continue
      }

      if (!this.context.ignoreSubtree.includes(childTag)) {
        this.walkThrough(child, false, depth + 1)
      }
      this.textProcessor.processText(child, child.tail)
    }

    if (isRoot) {
      if (this.context.todoMakeRelation.length > 0) {
        console.log('Processing', this.context.todoMakeRelation.length, 'deferred relations')
      }
      for (const [makeRelation, deferredElem, node, args] of this.context.todoMakeRelation) {
        const elemTag = this.elementHelper.getTag(deferredElem)
        if (!this.context.ignoreElem.includes(elemTag) && !this.context.ignoreTree.includes(elemTag)) {
          const deferredNode = this.context.elem2node.get(deferredElem)
          if (deferredNode) {
            const isRefersTo = makeRelation.name.includes('RefersTo')
            if (args.length > 0 && typeof args[0] === 'string') {
              makeRelation(node, deferredNode, ...args)
            } else if (isRefersTo) {
              makeRelation(node, deferredNode, ...args)
            } else {
              makeRelation(deferredNode, node, ...args)
            }
          }
        }
      }
    }
  }
}

