import type { ParsedElement, GraphNode } from './types'
import type { ConverterContext } from './context'
import { ElementHelper } from './elementHelper'
import { RelationFactory } from './relationFactory'

export class NodeFactory {
  constructor(
    private context: ConverterContext,
    private elementHelper: ElementHelper,
    private relationFactory: RelationFactory
  ) {}

  makeAlternative(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextInformationLayer", "Alternative"],
      properties: { name: this.elementHelper.getTag(elem) },
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    let parent: ParsedElement | null = elem
    while (true) {
      parent = this.context.elem2parent.get(parent) || null
      if (!parent) {
        break
      }
      const parentNode = this.context.elem2node.get(parent)
      if (parentNode && parentNode.labels.includes('Alternatives')) {
        this.relationFactory.makeAlternative(parentNode, node)
        return
      }
    }
  }

  makeAlternatives(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextInformationLayer", "Alternatives"],
      properties: { name: "corr-sic" },
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["column", "corr", "line", "part", "seg", "sic", "w"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeAnnotation(elem: ParsedElement): void {
    const elemTag = this.elementHelper.getTag(elem)
    if (elemTag === "note") {
      const node: GraphNode = {
        id: this.context.getNextId(),
        labels: ["Thing", "Annotation"],
        properties: {
          content: this.elementHelper.getXmlContent(elem),
          mimeType: "text/xml"
        },
        type: 'node'
      }
      const typeAttrib = this.elementHelper.getAttrib(elem, ["type"])
      if (typeAttrib.type) {
        node.properties.type = typeAttrib.type
      } else {
        node.properties.type = "note"
      }
      this.context.elem2node.set(elem, node)
      this.context.jsonList.push(node)

      const targetAttr = this.elementHelper.getAttrib(elem).target
      if (targetAttr) {
        const ids = targetAttr.split(' ')
        for (const id of ids) {
          const parent = this.elementHelper.findElementById(id, this.context.allElements)
          if (parent) {
            const parentNode = this.context.elem2node.get(parent)
            if (parentNode) {
              this.relationFactory.makeAnnotates(parentNode, node)
            } else {
              this.context.todoMakeRelation.push([this.relationFactory.makeAnnotates.bind(this.relationFactory), parent, node, []])
            }
          }
        }
      } else {
        const parent = this.elementHelper.getAncestor(elem, ["kolon", "stanza", "verse"], this.context.elem2parent)
        if (parent) {
          const parentNode = this.context.elem2node.get(parent)
          if (parentNode) {
            this.relationFactory.makeAnnotates(parentNode, node)
          }
        }
      }

      const allDescendants = this.elementHelper.findAllDescendants(elem)
      for (const descendant of allDescendants) {
        const corresp = this.elementHelper.getAttrib(descendant).corresp
        if (corresp) {
          const target = this.elementHelper.findElementById(corresp, this.context.allElements)
          if (target) {
            const targetNode = this.context.elem2node.get(target)
            if (targetNode) {
              this.relationFactory.makeMentions(node, targetNode)
            }
          }
        }
      }
    } else if (elemTag === "term") {
      const node: GraphNode = {
        id: this.context.getNextId(),
        labels: ["Thing", "Annotation"],
        properties: {
          content: elem.text ? elem.text.trim() : "",
          mimeType: "text/plain"
        },
        type: 'node'
      }
      const attrib = this.elementHelper.getAttrib(elem)
      if (attrib.key) {
        node.properties.type = attrib.key
      } else {
        node.properties.type = "term"
      }
      this.context.elem2node.set(elem, node)
      this.context.jsonList.push(node)

      const parent = this.elementHelper.getAncestor(elem, ["kolon", "stanza", "verse"], this.context.elem2parent)
      if (parent) {
        const parentNode = this.context.elem2node.get(parent)
        if (parentNode) {
          this.relationFactory.makeAnnotates(parentNode, node)
        }
      }
    }
  }

  makeCharacter(elem: ParsedElement, char: string | null = null): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "GrammaticalUnit", "Character"],
      properties: {
        text: char || "",
        whitespace: ""
      },
      type: 'node'
    }

    const damageParent = this.elementHelper.getAncestor(elem, ["damage"], this.context.elem2parent)
    if (damageParent) {
      node.properties.damage = "high"
      this.elementHelper.transferItem(this.elementHelper.getAttrib(damageParent), "degree", node.properties, "damage")
    }

    if (this.elementHelper.getAncestor(elem, ["unclear"], this.context.elem2parent)) {
      node.properties.unclear = true
    }

    this.context.jsonList.push(node)

    // When finding ancestor for character nodes, skip ignored elements like damage, unclear
    const ancestor = this.elementHelper.getAncestor(
      elem, 
      ["phr", "w"], 
      this.context.elem2parent,
      this.context.ignoreElem
    )
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeColon(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "PoetologicalUnit", "Colon"],
      properties: {},
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["n"]))

    const units = this.elementHelper.getAttrib(elem).units
    if (units) {
      const unitIds = this.elementHelper.removeHashtags(units).split(' ')
      let firstUnit: ParsedElement | null = null

      for (const unitId of unitIds) {
        const unit = this.elementHelper.findElementById(unitId, this.context.allElements)
        if (unit) {
          if (!firstUnit) {
            firstUnit = unit
            if (!node.properties.n) {
              Object.assign(node.properties, this.elementHelper.getAttrib(unit, ["n"]))
            }
          }

          const corresp = this.elementHelper.getAttrib(unit).corresp
          if (corresp) {
            const part = this.elementHelper.findElementById(corresp, this.context.allElements)
            if (part) {
              const partNode = this.context.elem2node.get(part)
              if (partNode) {
                this.relationFactory.makeRefersTo(node, partNode)
              }
            }
          }
        }
      }

      if (firstUnit) {
        const translations = this.elementHelper.findAllDescendants(firstUnit, "translation")
        for (const translation of translations) {
          const lang = this.elementHelper.getAttrib(translation).lang || ''
          const transNode = this.context.elem2node.get(translation)
          if (transNode) {
            this.relationFactory.makeTranslatedAs(node, transNode, lang)
          } else {
            this.context.todoMakeRelation.push([
              this.relationFactory.makeTranslatedAs.bind(this.relationFactory) as (start: GraphNode, end: GraphNode, ...args: unknown[]) => void,
              translation,
              node,
              [lang]
            ])
          }
        }
      }
    }

    if (!node.properties.n) {
      const parent = this.elementHelper.getAncestor(elem, ["stanza", "structure", "verse"], this.context.elem2parent)
      if (parent) {
        const parentNode = this.context.elem2node.get(parent)
        if (parentNode) {
          const containsList = this.context.id2contains.get(parentNode.id) || []
          const currentCount = containsList.length + 1
          node.properties.n = `auto-${currentCount}`
        }
      }
    }

    const ancestor = this.elementHelper.getAncestor(elem, ["stanza", "structure", "verse"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeColumn(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "TextArea", "Zone", "Column"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id", "n"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["surface"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeEditionObject(elem: ParsedElement): void {
    let docStatus = ""
    let textClass = ""
    let title = ""

    for (const e of this.context.allElements) {
      if (this.elementHelper.getTag(e) === "docStatus") {
        const status = this.elementHelper.getAttrib(e).status
        if (status && !docStatus) {
          docStatus = status
        }
      } else if (this.elementHelper.getTag(e) === "classCode") {
        const code = e.text?.trim()
        if (code && !textClass) {
          textClass = code
        }
      } else if (this.elementHelper.getTag(e) === "title") {
        const titleText = e.text?.trim()
        if (titleText && !title) {
          title = titleText
        }
      }
    }

    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "EditionObject"],
      properties: {
        docStatus,
        textClass,
        title
      },
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)
  }

  makeLine(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "TextArea", "Zone", "Line"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id", "n"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["column"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makePart(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "GraphicalUnit", "Part"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["corr", "line", "sic"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makePhrase(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "GrammaticalUnit", "Phrase"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const unitAncestor = this.elementHelper.getAncestor(elem, ["unit"], this.context.elem2parent)
    if (unitAncestor) {
      const unitId = this.elementHelper.getAttrib(unitAncestor, ["id"]).id
      if (unitId) {
        const colon = this.elementHelper.findElementByXPath(`.//kolon[@units='#${unitId}']`, this.context.allElements)
        if (colon) {
          this.context.todoMakeRelation.push([this.relationFactory.makeContains.bind(this.relationFactory), colon, node, []])
        }
      }
    }
  }

  makeSeg(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "GraphicalUnit", "Seg"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["corr", "line", "part", "sic"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeSign(elem: ParsedElement, char: string | null = null): void {
    if (this.elementHelper.getTag(elem) === "pc" && !this.elementHelper.getAncestor(elem, ["facsimile"], this.context.elem2parent)) {
      return
    }

    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "GraphicalUnit", "Sign"],
      properties: {
        index: this.context.index2sign.length,
        text: char || "",
        type: this.elementHelper.getTag(elem) === "pc" ? "pc" : "g",
        whitespace: ""
      },
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["id"]))

    const damageParent = this.elementHelper.getAncestor(elem, ["damage"], this.context.elem2parent)
    if (damageParent) {
      node.properties.damage = "high"
      this.elementHelper.transferItem(this.elementHelper.getAttrib(damageParent), "degree", node.properties, "damage")
    }

    this.elementHelper.transferItem(this.elementHelper.getAttrib(elem), "type", node.properties, "subtype")

    this.context.index2sign.push(node)
    if (["g", "pc"].includes(this.elementHelper.getTag(elem))) {
      this.context.elem2node.set(elem, node)
    }
    this.context.jsonList.push(node)

    // When finding ancestor for sign nodes, skip ignored elements like damage, unclear
    // This ensures signs inside damage elements are connected to their proper parent (seg, part, etc.)
    const ancestor = this.elementHelper.getAncestor(
      elem, 
      ["corr", "line", "part", "seg", "sic"], 
      this.context.elem2parent,
      this.context.ignoreElem
    )
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeStanza(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "PoetologicalUnit", "Stanza"],
      properties: {},
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["structure"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeSurface(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "VisualUnit", "TextArea", "Surface"],
      properties: {},
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["facsimile"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeTranslationUnit(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "Annotation", "TranslationUnit"],
      properties: {
        content: this.elementHelper.getXmlContent(elem),
        mimeType: "text/xml"
      },
      type: 'node'
    }
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const allDescendants = this.elementHelper.findAllDescendants(elem)
    for (const descendant of allDescendants) {
      const corresp = this.elementHelper.getAttrib(descendant).corresp
      if (corresp) {
        const target = this.elementHelper.findElementById(corresp, this.context.allElements)
        if (target) {
          const targetNode = this.context.elem2node.get(target)
          if (targetNode) {
            this.relationFactory.makeMentions(node, targetNode)
          }
        }
      }
    }
  }

  makeTransliterationLayer(elem: ParsedElement): void {
    const elemTag = this.elementHelper.getTag(elem)
    const existingLayer = this.context.tag2layer.get(elemTag)
    if (existingLayer) {
      this.context.elem2node.set(elem, existingLayer)
      return
    }

    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextInformationLayer", "VisualLayer", "TransliterationLayer"],
      properties: {},
      type: 'node'
    }
    this.context.tag2layer.set(elemTag, node)
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["text"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeHasLayer(ancestorNode, node)
      }
    }
  }

  makeVerse(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "PoetologicalUnit", "Verse"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["n"]))

    if (!node.properties.n) {
      const kolons = this.elementHelper.findAllDescendants(elem, "kolon")
      for (const kolon of kolons) {
        const units = this.elementHelper.getAttrib(kolon).units
        if (units) {
          const unitId = this.elementHelper.removeHashtags(units).split(' ')[0]
          const unit = this.elementHelper.findElementById(unitId, this.context.allElements)
          if (unit) {
            const unitAttrib = this.elementHelper.getAttrib(unit)
            if (unitAttrib.n) {
              node.properties.n = unitAttrib.n
              break
            }
          }
        }
      }
    }

    if (!node.properties.n) {
      const parent = this.elementHelper.getAncestor(elem, ["stanza", "structure"], this.context.elem2parent)
      if (parent) {
        const parentNode = this.context.elem2node.get(parent)
        if (parentNode) {
          const containsList = this.context.id2contains.get(parentNode.id) || []
          const currentCount = containsList.length + 1
          node.properties.n = `auto-${currentCount}`
        }
      }
    }

    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["stanza", "structure"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeContains(ancestorNode, node)
      }
    }
  }

  makeVocalisationLayer(elem: ParsedElement): void {
    const elemTag = this.elementHelper.getTag(elem)
    const existingLayer = this.context.tag2layer.get(elemTag)
    if (existingLayer) {
      this.context.elem2node.set(elem, existingLayer)
      return
    }

    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextInformationLayer", "VocalisationLayer"],
      properties: {},
      type: 'node'
    }
    this.context.tag2layer.set(elemTag, node)
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const ancestor = this.elementHelper.getAncestor(elem, ["text"], this.context.elem2parent)
    if (ancestor) {
      const ancestorNode = this.context.elem2node.get(ancestor)
      if (ancestorNode) {
        this.relationFactory.makeHasLayer(ancestorNode, node)
      }
    }
  }

  makeWord(elem: ParsedElement): void {
    const node: GraphNode = {
      id: this.context.getNextId(),
      labels: ["Thing", "TextUnit", "GrammaticalUnit", "MorphologicalUnit", "Word"],
      properties: {},
      type: 'node'
    }
    Object.assign(node.properties, this.elementHelper.getAttrib(elem, ["cert", "id"]))
    this.context.elem2node.set(elem, node)
    this.context.jsonList.push(node)

    const phrAncestor = this.elementHelper.getAncestor(elem, ["phr"], this.context.elem2parent)
    if (phrAncestor) {
      const phrNode = this.context.elem2node.get(phrAncestor)
      if (phrNode) {
        this.relationFactory.makeContains(phrNode, node)
      }
    } else {
      const unitAncestor = this.elementHelper.getAncestor(elem, ["unit"], this.context.elem2parent)
      if (unitAncestor) {
        const unitId = this.elementHelper.getAttrib(unitAncestor, ["id"]).id
        if (unitId) {
          const colon = this.elementHelper.findElementByXPath(`.//kolon[@units='#${unitId}']`, this.context.allElements)
          if (colon) {
            this.context.todoMakeRelation.push([this.relationFactory.makeContains.bind(this.relationFactory), colon, node, []])
          }
        }
      }
    }

    const corresp = this.elementHelper.getAttrib(elem).corresp
    if (corresp) {
      const seg = this.elementHelper.findElementById(corresp, this.context.allElements)
      if (seg) {
        const segNode = this.context.elem2node.get(seg)
        if (segNode) {
          this.relationFactory.makeRefersTo(node, segNode)
        } else {
          this.context.todoMakeRelation.push([
            this.relationFactory.makeRefersTo.bind(this.relationFactory) as (start: GraphNode, end: GraphNode) => void,
            seg,
            node,
            []
          ])
        }
      }
    }

    const annotationTypes = ["ana", "lemma"]
    const annotationAttrs = this.elementHelper.getAttrib(elem, annotationTypes)
    for (const annotationType of annotationTypes) {
      if (annotationType in annotationAttrs) {
        const annotationNode: GraphNode = {
          id: this.context.getNextId(),
          labels: ["Thing", "Annotation"],
          properties: {
            content: annotationAttrs[annotationType],
            mimeType: "text/plain",
            type: annotationType
          },
          type: 'node'
        }
        this.context.jsonList.push(annotationNode)
        this.relationFactory.makeAnnotates(node, annotationNode)
      }
    }
  }
}

