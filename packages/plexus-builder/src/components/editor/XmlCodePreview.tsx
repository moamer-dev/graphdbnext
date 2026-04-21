'use client'

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { xml as xmlLang } from '@codemirror/lang-xml'
import { EditorView, Decoration } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'
import { foldAll, unfoldAll } from '@codemirror/language'
import { cn } from '../../utils/cn'
import { 
  WrapText, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  CheckCircle2 
} from 'lucide-react'
import { Button } from '../ui/button'

interface XmlCodePreviewProps {
  value: string
  height?: string
  wrapWord?: boolean
  scrollToPosition?: number | null
  scrollToId?: string | null // xml:id or id attribute value
  onChange?: (value: string) => void
}

export interface XmlCodePreviewRef {
  scrollToPosition: (position: number) => void
  scrollToId: (id: string) => void
}

import { ReactCodeMirrorProps } from '@uiw/react-codemirror'

interface ExtendedCodeMirrorProps extends ReactCodeMirrorProps {
  className?: string
  style?: React.CSSProperties
}

const TypedCodeMirror = CodeMirror as any as React.ForwardRefExoticComponent<
  ExtendedCodeMirrorProps & React.RefAttributes<ReactCodeMirrorRef>
>

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
  ({ value, height = '500px', wrapWord = false, scrollToPosition, scrollToId, onChange }, ref) => {
    const { theme } = useTheme()
    const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isWrapping, setIsWrapping] = React.useState(wrapWord)
    const [isAllCollapsed, setIsAllCollapsed] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)

    const handleToggleFold = () => {
      if (codeMirrorRef.current?.view) {
        if (isAllCollapsed) {
          unfoldAll(codeMirrorRef.current.view)
        } else {
          foldAll(codeMirrorRef.current.view)
        }
        setIsAllCollapsed(!isAllCollapsed)
      }
    }

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy content')
      }
    }

    const extensions = [
      xmlLang(), 
      highlightField,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" }
      })
    ]

    if (isWrapping) {
      extensions.push(EditorView.lineWrapping)
    }

    // Function to get the editor view
    const getEditorView = useCallback((): EditorView | null => {
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
    }, [])

    // Function to scroll to position
    const scrollToPos = useCallback((position: number) => {
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
    }, [getEditorView])

    // Function to scroll to ID (simple and reliable - IDs are unique)
    const scrollToIdPos = useCallback((id: string) => {
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
        // Verify the position by checking what's at that location
        const tagPreview = value.substring(tagStart, Math.min(tagStart + 100, value.length))

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
    }, [value, getEditorView, scrollToPos])

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
    }, [scrollToPosition, scrollToPos])

    // Handle scrollToId prop changes
    useEffect(() => {
      if (scrollToId) {
        setTimeout(() => {
          scrollToIdPos(scrollToId)
        }, 200)
      }
    }, [scrollToId, scrollToIdPos])

    return (
      <div 
        ref={containerRef} 
        className="flex flex-col flex-1 min-h-0 overflow-hidden" 
        style={{ height, width: '100%' }}
      >
        <div className="h-9 border-b border-border/40 bg-muted/5 flex items-center justify-between px-3 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-2 rounded-lg text-[10px] font-bold gap-1.5 transition-all shadow-none",
                isWrapping ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
              onClick={() => setIsWrapping(!isWrapping)}
            >
              <WrapText className="h-3 w-3" />
              {isWrapping ? 'WRAP ON' : 'WRAP OFF'}
            </Button>
            <div className="w-px h-3 bg-border/60 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-2 rounded-lg text-[10px] font-bold gap-1.5 transition-all shadow-none",
                isAllCollapsed ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
              onClick={handleToggleFold}
            >
              {isAllCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              {isAllCollapsed ? 'EXPAND' : 'COLLAPSE'}
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-6 px-2 rounded-lg text-[10px] font-bold gap-1.5 transition-all shadow-none",
              isCopied ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            onClick={handleCopy}
          >
            {isCopied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {isCopied ? 'COPIED!' : 'COPY'}
          </Button>
        </div>
        <style>{`
          .cm-highlighted-xml-element {
            background-color: ${theme === 'dark' ? 'rgba(250, 204, 21, 0.2)' : '#fef08a'} !important;
            padding: 2px 0;
            border-radius: 2px;
            transition: background-color 0.2s;
            display: inline-block;
            box-shadow: 0 0 0 2px ${theme === 'dark' ? 'rgba(250, 204, 21, 0.4)' : '#fbbf24'};
          }
        `}</style>
        <TypedCodeMirror
          ref={codeMirrorRef}
          value={value}
          height="100%"
          editable={true}
          className="flex-1 min-h-0"
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: false,
            foldGutter: true,
            bracketMatching: true,
            searchKeymap: true
          } as any}
          extensions={extensions}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    )
  }
)

XmlCodePreview.displayName = 'XmlCodePreview'
