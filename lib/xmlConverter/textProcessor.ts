import type { ParsedElement } from './types'
import type { ConverterContext } from './context'
import { ElementHelper } from './elementHelper'

export class TextProcessor {
  constructor(
    private context: ConverterContext,
    private elementHelper: ElementHelper,
    private makeNodeSign: (elem: ParsedElement, char: string | null) => void,
    private makeNodeCharacter: (elem: ParsedElement, char: string | null) => void
  ) {}

  processText(elem: ParsedElement, text: string | null): void {
    if (!text) return

    const ancestorTags: string[] = []
    let current: ParsedElement | null = elem
    while (current) {
      ancestorTags.push(this.elementHelper.getTag(current))
      current = this.context.elem2parent.get(current) || null
    }

    const elemTag = this.elementHelper.getTag(elem)
    const rawTag = elem.tag.split('}').pop()?.split(':').pop() || elem.tag
    const isGraphicalElement = elemTag === "g" || elemTag === "pc" ||
                               ancestorTags[0] === "g" || ancestorTags[0] === "pc" ||
                               rawTag === "g" || rawTag === "pc"

    // Special case: text inside <w> (Word) should produce Character nodes (schema: Word -> contains Character)
    if (elemTag === "w" || ancestorTags.includes("w")) {
      let whitespace = ""
      for (const char of text) {
        if (char.trim()) {
          this.addWhitespaceCharacter(whitespace)
          whitespace = ""
          this.makeNodeCharacter(elem, char)
        } else {
          whitespace += char
        }
      }
      this.addWhitespaceCharacter(whitespace)
      return
    }

    let hasLineAncestor = ancestorTags.includes("line")
    if (!hasLineAncestor && isGraphicalElement) {
      let checkParent: ParsedElement | null = this.context.elem2parent.get(elem) || null
      while (checkParent) {
        const parentTag = this.elementHelper.getTag(checkParent)
        if (parentTag === "line") {
          hasLineAncestor = true
          break
        }
        checkParent = this.context.elem2parent.get(checkParent) || null
      }
    }

    if (isGraphicalElement) {
      let whitespace = ""
      for (const char of text) {
        if (ancestorTags.includes("g") || char.trim()) {
          this.addWhitespaceSign(whitespace)
          whitespace = ""
          this.makeNodeSign(elem, char)
        } else {
          whitespace += char
        }
      }
      this.addWhitespaceSign(whitespace)
    } else if (hasLineAncestor || ancestorTags.includes("line")) {
      let whitespace = ""
      for (const char of text) {
        if (ancestorTags.includes("g") || char.trim()) {
          this.addWhitespaceSign(whitespace)
          whitespace = ""
          this.makeNodeSign(elem, char)
        } else {
          whitespace += char
        }
      }
      this.addWhitespaceSign(whitespace)
    } else if (ancestorTags.includes("transcription")) {
      if (!isGraphicalElement) {
        let whitespace = ""
        for (const char of text) {
          if (char.trim()) {
            this.addWhitespaceCharacter(whitespace)
            whitespace = ""
            this.makeNodeCharacter(elem, char)
          } else {
            whitespace += char
          }
        }
        this.addWhitespaceCharacter(whitespace)
      } else {
        let whitespace = ""
        for (const char of text) {
          if (char.trim()) {
            this.addWhitespaceSign(whitespace)
            whitespace = ""
            this.makeNodeSign(elem, char)
          } else {
            whitespace += char
          }
        }
        this.addWhitespaceSign(whitespace)
      }
    }
  }

  private addWhitespaceCharacter(text: string): void {
    for (let i = this.context.jsonList.length - 1; i >= 0; i--) {
      const node = this.context.jsonList[i]
      if (node.type === 'node' && node.labels.includes('Character')) {
        node.properties.whitespace = (node.properties.whitespace as string || '') + text
        break
      }
    }
  }

  private addWhitespaceSign(text: string): void {
    if (this.context.index2sign.length > 0) {
      const lastSign = this.context.index2sign[this.context.index2sign.length - 1]
      lastSign.properties.whitespace = (lastSign.properties.whitespace as string || '') + text
    }
  }
}

