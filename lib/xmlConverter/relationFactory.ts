import type { GraphNode, GraphRelationship } from './types'
import type { ConverterContext } from './context'

export class RelationFactory {
  constructor(private context: ConverterContext) {}

  makeAlternative(startNode: GraphNode, endNode: GraphNode): void {
    if (!this.context.id2contains.has(startNode.id)) {
      this.context.id2contains.set(startNode.id, [])
    }
    const containsList = this.context.id2contains.get(startNode.id)!
    const relationship: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "alternative",
      properties: {
        order: containsList.length + 1,
        pref: containsList.length === 0
      },
      start: startNode.id,
      type: 'relationship'
    }
    containsList.push(relationship)
    this.context.jsonList.push(relationship)
  }

  makeAnnotates(startNode: GraphNode, endNode: GraphNode): void {
    const rel1: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "annotatedBy",
      properties: {},
      start: startNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(rel1)

    const rel2: GraphRelationship = {
      end: startNode.id,
      id: this.context.getNextId(),
      label: "annotates",
      properties: {},
      start: endNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(rel2)
  }

  makeContains(startNode: GraphNode, endNode: GraphNode): void {
    const has = (node: GraphNode, label: string): boolean => {
      return node.labels.includes(label)
    }

    let allowed = false

    if (has(startNode, "TransliterationLayer") && has(endNode, "Surface")) {
      allowed = true
    } else if (has(startNode, "Surface") && (has(endNode, "Column") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Column") && (has(endNode, "Line") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Line") && (has(endNode, "Part") || has(endNode, "Seg") || has(endNode, "Sign") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Part") && (has(endNode, "Seg") || has(endNode, "Sign") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Seg") && (has(endNode, "Sign") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "VocalisationLayer") && (has(endNode, "Stanza") || has(endNode, "Verse") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Stanza") && (has(endNode, "Verse") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Verse") && (has(endNode, "Colon") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Colon") && (has(endNode, "Word") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Phrase") && (has(endNode, "Word") || has(endNode, "Alternatives"))) {
      allowed = true
    } else if (has(startNode, "Word") && has(endNode, "Character")) {
      allowed = true
    }

    if (!allowed && !startNode.labels.includes("Alternative")) {
      return
    }

    if (!this.context.id2contains.has(startNode.id)) {
      this.context.id2contains.set(startNode.id, [])
    }
    const containsList = this.context.id2contains.get(startNode.id)!

    let relationship: GraphRelationship
    if (startNode.labels.includes("Alternative")) {
      relationship = {
        end: endNode.id,
        id: this.context.getNextId(),
        label: "expressedAs",
        properties: {},
        start: startNode.id,
        type: 'relationship'
      }
    } else {
      relationship = {
        end: endNode.id,
        id: this.context.getNextId(),
        label: "contains",
        properties: {
          pos: containsList.length
        },
        start: startNode.id,
        type: 'relationship'
      }
      containsList.push(relationship)
    }
    this.context.jsonList.push(relationship)
  }

  makeHasLayer(startNode: GraphNode, endNode: GraphNode): void {
    const relationship: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "hasLayer",
      properties: {},
      start: startNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(relationship)
  }

  makeMentions(startNode: GraphNode, endNode: GraphNode): void {
    const relationship: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "mentions",
      properties: {},
      start: startNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(relationship)
  }

  makeRefersTo(startNode: GraphNode, endNode: GraphNode): void {
    const relationship: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "refersTo",
      properties: {},
      start: startNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(relationship)
  }

  makeTranslatedAs(startNode: GraphNode, endNode: GraphNode, lang?: string): void {
    const relationship: GraphRelationship = {
      end: endNode.id,
      id: this.context.getNextId(),
      label: "translatedAs",
      properties: { lang: lang || '' },
      start: startNode.id,
      type: 'relationship'
    }
    this.context.jsonList.push(relationship)
  }
}

