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

// Effect to set highlight ranges
const setHighlight = StateEffect.define<Array<{ start: number; end: number }> | null>()

// State field to manage highlight decorations
const highlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setHighlight)) {
        if (effect.value === null || effect.value.length === 0) {
          decorations = Decoration.none
        } else {
          const mark = Decoration.mark({
            class: 'cm-highlighted-xml-element',
            attributes: {
              style: 'background-color: rgba(254, 240, 138, 0.85) !important; color: #000 !important; font-weight: 600; padding: 1px 3px; border-radius: 3px; box-shadow: 0 0 0 2px #fbbf24, 0 2px 4px rgba(251, 191, 36, 0.3);'
            }
          })
          const ranges = effect.value.map(r => mark.range(r.start, r.end))
          // CodeMirror requires range sets to be sorted
          ranges.sort((a, b) => a.from - b.from)
          decorations = Decoration.set(ranges, true)
        }
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

interface MatchedTag {
  start: number
  end: number
  line: number
  text: string
}

export const XmlCodePreview = forwardRef<XmlCodePreviewRef, XmlCodePreviewProps>(
  ({ value, height = '500px', wrapWord = false, scrollToPosition, scrollToId, onChange }, ref) => {
    const { theme } = useTheme()
    const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isWrapping, setIsWrapping] = React.useState(wrapWord)
    const [isAllCollapsed, setIsAllCollapsed] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)
    const [matchedElements, setMatchedElements] = React.useState<MatchedTag[]>([])

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

    // Function to scroll to position (Persistent highlight without auto-clear)
    const scrollToPos = useCallback((position: number) => {
      const view = getEditorView()
      if (view) {
        const doc = view.state.doc
        if (position >= 0 && position <= doc.length) {
          try {
            view.dispatch({
              effects: [
                EditorView.scrollIntoView(position, {
                  y: 'center',
                  x: 'start'
                })
              ],
              selection: { anchor: position, head: position }
            })
          } catch (error) {
            console.error('Error scrolling to position:', error)
          }
        }
      }
    }, [getEditorView])

    // Function to scroll to ID and highlight ALL matching elements
    const scrollToIdPos = useCallback((id: string | null) => {
      if (!value || !id) {
        setMatchedElements([])
        const view = getEditorView()
        if (view) {
          view.dispatch({ effects: setHighlight.of(null) })
        }
        return
      }

      const cleanId = id.trim()
      const lowerId = cleanId.toLowerCase()

      const foundRanges: Array<{ start: number; end: number }> = []
      const foundMatches: MatchedTag[] = []
      const seenStarts = new Set<number>()

      // 1. Search for element tags: <Tag ...>, <tag ...>, <Tag>, <tag>
      const tagRegex = new RegExp(`<(${cleanId}|${lowerId})[\\s/>]`, 'gi')
      let match: RegExpExecArray | null

      while ((match = tagRegex.exec(value)) !== null) {
        const start = match.index
        if (seenStarts.has(start)) continue
        seenStarts.add(start)

        let end = start
        while (end < value.length && value[end] !== '>') {
          end++
        }
        if (end < value.length && value[end] === '>') {
          end++ // include closing '>'
        } else {
          end = Math.min(start + match[0].length, value.length)
        }

        const lineNumber = value.substring(0, start).split('\n').length
        const previewText = value.substring(start, Math.min(start + 40, value.length)).replace(/\n/g, ' ')

        foundRanges.push({ start, end })
        foundMatches.push({ start, end, line: lineNumber, text: previewText })
      }

      // 2. Search for unique IDs: xml:id="id" or id="id"
      const idRegex = new RegExp(`(xml:id|id)=["']${cleanId}["']`, 'gi')
      while ((match = idRegex.exec(value)) !== null) {
        // Find opening '<' of tag
        let start = match.index
        while (start > 0 && value[start] !== '<') {
          start--
        }
        if (start >= 0 && value[start] === '<' && !seenStarts.has(start)) {
          seenStarts.add(start)
          let end = start
          while (end < value.length && value[end] !== '>') {
            end++
          }
          if (end < value.length) end++

          const lineNumber = value.substring(0, start).split('\n').length
          const previewText = value.substring(start, Math.min(start + 40, value.length)).replace(/\n/g, ' ')

          foundRanges.push({ start, end })
          foundMatches.push({ start, end, line: lineNumber, text: previewText })
        }
      }

      setMatchedElements(foundMatches)

      setTimeout(() => {
        const view = getEditorView()
        if (view && foundRanges.length > 0) {
          view.dispatch({
            effects: [setHighlight.of(foundRanges)]
          })
          scrollToPos(foundRanges[0].start)
        }
      }, 100)
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
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <TypedCodeMirror
            ref={codeMirrorRef}
            value={value}
            height="100%"
            editable={true}
            className="flex-1 min-h-0 h-full"
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

          {matchedElements.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-5 bg-background/80 backdrop-blur-xs border-l border-border/40 z-20 flex flex-col items-center select-none">
              <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 py-1" title={`${matchedElements.length} elements matched`}>
                {matchedElements.length}
              </div>
              <div className="relative flex-1 w-full overflow-hidden">
                {matchedElements.map((match, idx) => {
                  const topPercent = Math.min(98, Math.max(1, (match.start / (value.length || 1)) * 100))
                  return (
                    <div
                      key={idx}
                      title={`Line ${match.line}: ${match.text}`}
                      onClick={() => scrollToPos(match.start)}
                      className="absolute left-0.5 right-0.5 h-1.5 bg-amber-400 dark:bg-amber-500 hover:bg-amber-600 hover:scale-y-150 cursor-pointer shadow-sm rounded-xs transition-all"
                      style={{ top: `${topPercent}%` }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

XmlCodePreview.displayName = 'XmlCodePreview'
