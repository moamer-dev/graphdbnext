'use client'

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { xml as xmlLang } from '@codemirror/lang-xml'
import { EditorView, Decoration } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'

interface XmlCodePreviewProps {
  value: string
  height?: string
  wrapWord?: boolean
  scrollToPosition?: number | null
  scrollToId?: string | null // xml:id or id attribute value
}

export interface XmlCodePreviewRef {
  scrollToPosition: (position: number) => void
  scrollToId: (id: string) => void
}

// Effect to set highlight position
const setHighlight = StateEffect.define<number | null>()

// State field to manage highlight decorations
const highlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setHighlight)) {
        if (effect.value === null) {
          decorations = Decoration.none
        } else {
          const pos = effect.value
          const doc = tr.state.doc
          if (pos >= 0 && pos < doc.length) {
            // Find the end of the opening tag
            let endPos = pos
            while (endPos < doc.length) {
              const char = doc.sliceString(endPos, endPos + 1)
              if (char === '>') {
                endPos++
                break
              }
              endPos++
            }
            if (endPos > pos) {
              const mark = Decoration.mark({
                class: 'cm-highlighted-xml-element',
                attributes: {
                  style: 'background-color: #fef08a !important; padding: 2px 0; border-radius: 2px; transition: background-color 0.2s; display: inline-block; box-shadow: 0 0 0 2px #fbbf24;'
                }
              })
              decorations = Decoration.set([mark.range(pos, endPos)])
            }
          }
        }
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

export const XmlCodePreview = forwardRef<XmlCodePreviewRef, XmlCodePreviewProps>(
  ({ value, height = '500px', wrapWord = false, scrollToPosition, scrollToId }, ref) => {
    const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const extensions = [xmlLang(), highlightField]

    if (wrapWord) {
      extensions.push(EditorView.lineWrapping)
    }

    // Function to get the editor view
    const getEditorView = (): EditorView | null => {
      if (codeMirrorRef.current?.view) {
        return codeMirrorRef.current.view
      }
      if (containerRef.current) {
        const cmEditor = containerRef.current.querySelector('.cm-editor') as HTMLElement
        if (cmEditor) {
          const view = EditorView.findFromDOM(cmEditor)
          if (view) {
            return view
          }
        }
      }
      return null
    }

    // Function to scroll to position
    const scrollToPos = (position: number) => {
      const view = getEditorView()
      if (view) {
        const doc = view.state.doc
        if (position >= 0 && position <= doc.length) {
          try {
            view.dispatch({
              effects: [
                setHighlight.of(position),
                EditorView.scrollIntoView(position, {
                  y: 'center',
                  x: 'start'
                })
              ],
              selection: { anchor: position, head: position }
            })

            // Clear highlight after 3 seconds
            setTimeout(() => {
              if (view) {
                view.dispatch({
                  effects: setHighlight.of(null)
                })
              }
            }, 3000)
          } catch (error) {
            console.error('Error scrolling to position:', error)
          }
        }
      }
    }

    // Function to scroll to ID (simple and reliable - IDs are unique)
    const scrollToIdPos = (id: string) => {
      if (!value) return

      console.log('Searching for ID:', id)

      // Since IDs are unique, we can search for the ID value directly
      // Look for patterns: xml:id="id" or id="id" (with double or single quotes)
      const patterns = [
        `xml:id="${id}"`,
        `id="${id}"`,
        `xml:id='${id}'`,
        `id='${id}'`
      ]

      let tagStart: number | null = null
      let tagEnd: number | null = null

      // Try each pattern
      for (const pattern of patterns) {
        const index = value.indexOf(pattern)
        if (index !== -1) {
          // Check if this is in a reference (like corresp="#id")
          // Look for # before the pattern
          if (index > 0 && value[index - 1] === '#') {
            console.log('Skipping - ID is in a reference (corresp="#id")')
            continue
          }

          // Found the pattern, now find the opening < of the tag
          let start = index
          while (start > 0 && value[start] !== '<') {
            start--
          }

          if (start >= 0 && value[start] === '<') {
            // Find the closing > of the tag
            let end = start
            while (end < value.length && value[end] !== '>') {
              end++
            }
            if (end < value.length && value[end] === '>') {
              tagStart = start
              tagEnd = end + 1
              console.log('Found ID at position:', tagStart, 'to', tagEnd, 'pattern:', pattern)
              break
            }
          }
        }
      }

      if (tagStart !== null) {
        console.log('Scrolling to ID at position:', tagStart, 'tag end:', tagEnd)
        // Verify the position by checking what's at that location
        const tagPreview = value.substring(tagStart, Math.min(tagStart + 100, value.length))
        console.log('Tag preview at position:', tagPreview)

        // Add a small delay to ensure CodeMirror is ready, then scroll
        setTimeout(() => {
          const view = getEditorView()
          if (view) {
            const doc = view.state.doc
            console.log('CodeMirror doc length:', doc.length, 'value length:', value.length)

            // Verify the position is valid
            if (tagStart >= 0 && tagStart <= doc.length) {
              // Double-check: verify the content at this position matches
              const docContent = doc.sliceString(tagStart, Math.min(tagStart + 50, doc.length))
              console.log('CodeMirror content at position:', docContent)

              if (docContent.includes(id)) {
                console.log('Position verified, scrolling...')
                scrollToPos(tagStart)
              } else {
                console.warn('Position mismatch! Expected ID at position, but found:', docContent)
                // Try to find the ID in the CodeMirror document
                const docString = doc.toString()
                const docIndex = docString.indexOf(`xml:id="${id}"`)
                if (docIndex !== -1) {
                  // Find the opening <
                  let docStart = docIndex
                  while (docStart > 0 && docString[docStart] !== '<') {
                    docStart--
                  }
                  if (docStart >= 0 && docString[docStart] === '<') {
                    console.log('Found ID in CodeMirror doc at position:', docStart)
                    scrollToPos(docStart)
                  }
                }
              }
            } else {
              console.warn('Position out of bounds:', tagStart, 'doc length:', doc.length)
            }
          } else {
            console.warn('Editor view not available')
          }
        }, 100)
      } else {
        console.warn('Could not find ID in XML:', id)
      }
    }

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      scrollToPosition: scrollToPos,
      scrollToId: scrollToIdPos
    }))

    // Handle scrollToPosition prop changes
    useEffect(() => {
      if (scrollToPosition !== null && scrollToPosition !== undefined) {
        setTimeout(() => {
          scrollToPos(scrollToPosition)
        }, 200)
      }
    }, [scrollToPosition])

    // Handle scrollToId prop changes
    useEffect(() => {
      if (scrollToId) {
        setTimeout(() => {
          scrollToIdPos(scrollToId)
        }, 200)
      }
    }, [scrollToId])

    return (
      <>
        <style>{`
          .cm-highlighted-xml-element {
            background-color: #fef08a !important;
            padding: 2px 0;
            border-radius: 2px;
            transition: background-color 0.2s;
            display: inline-block;
            box-shadow: 0 0 0 2px #fbbf24;
          }
          .cm-editor, .cm-scroller {
            height: 100% !important;
          }
        `}</style>
        <div ref={containerRef} style={{ height, width: '100%' }}>
          <CodeMirror
            ref={codeMirrorRef}
            value={value}
            height={height}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: false,
              foldGutter: true,
              bracketMatching: true
            }}
            extensions={extensions}
            theme="light"
          />
        </div>
      </>
    )
  }
)

XmlCodePreview.displayName = 'XmlCodePreview'
