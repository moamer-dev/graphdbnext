declare module '@uiw/react-codemirror' {
  import * as React from 'react'
  import { EditorView } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  
  export interface BasicSetupOptions {
    lineNumbers?: boolean
    highlightActiveLine?: boolean
    foldGutter?: boolean
    bracketMatching?: boolean
  }
  
  export interface ReactCodeMirrorRef {
    view?: EditorView
    state?: EditorState
    editor?: HTMLElement
  }
  
  export interface ReactCodeMirrorProps {
    value?: string
    height?: string
    editable?: boolean
    basicSetup?: BasicSetupOptions | boolean
    extensions?: any[]
    theme?: any
    onChange?: (value: string, viewUpdate?: any) => void
    onCreateEditor?: (view: EditorView, state: EditorState) => void
    onStatistics?: (data: any) => void
  }
  
  const CodeMirror: React.ForwardRefExoticComponent<ReactCodeMirrorProps & React.RefAttributes<ReactCodeMirrorRef>>
  export default CodeMirror
  export type { ReactCodeMirrorRef }
}

declare module '@codemirror/lang-xml' {
  export function xml (): any
}


