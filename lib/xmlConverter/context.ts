import type { ParsedElement, GraphNode, GraphRelationship, GraphElement } from './types'

export class ConverterContext {
  jsonList: GraphElement[] = []
  elem2node = new Map<ParsedElement, GraphNode>()
  elem2parent = new Map<ParsedElement, ParsedElement>()
  id2contains = new Map<number, GraphRelationship[]>()
  index2sign: GraphNode[] = []
  tag2layer = new Map<string, GraphNode>()
  todoMakeRelation: Array<[(start: GraphNode, end: GraphNode, ...args: unknown[]) => void, ParsedElement, GraphNode, unknown[]]> = []
  nextId = 0
  allElements: ParsedElement[] = []

  readonly ignoreElem = [
    "ana", "damage", "del", "edxml", "g", "lb", "notes", "philology",
    "supplied", "surplus", "transcription", "unclear", "unit", "units"
  ]

  readonly ignoreSubtree = ["note", "term", "translation"]
  readonly ignoreTree = ["header", "metamark"]

  getNextId(): number {
    return this.nextId++
  }
}

