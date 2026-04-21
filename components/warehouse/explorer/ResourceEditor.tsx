import { 
  FolderSearch, 
  Save,
  Loader2,
  Clock,
  HardDrive,
  X,
  Lock,
  Trash2,
  PencilLine,
  Check,
  User as UserIcon,
  WrapText,
  ChevronUp,
  ChevronDown,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { EditorView } from '@codemirror/view'
import { foldAll, unfoldAll } from '@codemirror/language'
import { FileIcon } from './FileIcon'
import { useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/utils'
import { ReactCodeMirrorProps } from '@uiw/react-codemirror'

interface ExtendedCodeMirrorProps extends ReactCodeMirrorProps {
  className?: string
  style?: React.CSSProperties
}

const TypedCodeMirror = CodeMirror as any as React.ForwardRefExoticComponent<
  ExtendedCodeMirrorProps & React.RefAttributes<ReactCodeMirrorRef>
>

interface ResourceEditorProps {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  selectedItem: any
  isLoadingDetail: boolean
  editedContent: string
  setEditedContent: (val: string) => void
  isRenaming: boolean
  setIsRenaming: (val: boolean) => void
  tempName: string
  setTempName: (val: string) => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
  handleSave: () => Promise<void>
  handleRename: () => Promise<void>
  setDeleteId: (id: string | null) => void
  can: (action: string, resource: string, data?: any) => boolean
  resourceKey: string
  isUpdatePending: boolean
}

export const ResourceEditor = ({
  selectedId,
  setSelectedId,
  selectedItem,
  isLoadingDetail,
  editedContent,
  setEditedContent,
  isRenaming,
  setIsRenaming,
  tempName,
  setTempName,
  renameInputRef,
  handleSave,
  handleRename,
  setDeleteId,
  can,
  resourceKey,
  isUpdatePending
}: ResourceEditorProps) => {
  const { theme } = useTheme()
  const [isWrapping, setIsWrapping] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isAllCollapsed, setIsAllCollapsed] = useState(false)
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  const handleToggleFold = () => {
    if (editorRef.current?.view) {
      if (isAllCollapsed) {
        unfoldAll(editorRef.current.view)
      } else {
        foldAll(editorRef.current.view)
      }
      setIsAllCollapsed(!isAllCollapsed)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setIsCopied(true)
      toast.success('Content copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy content')
    }
  }

  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 relative z-10">
        <div className="p-6 rounded-3xl bg-muted/10 mb-6 group hover:scale-[1.05] transition-transform duration-500">
          <FolderSearch className="h-14 w-14 text-primary/10 group-hover:text-primary/20 transition-colors" />
        </div>
        <p className="text-[13px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Select a file to inspect</p>
        <p className="text-[11px] text-muted-foreground/40 max-w-xs">Efficiently manage your data warehouse assets with real-time editing and RBAC protection.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden min-h-0">
      <div className="h-14 border-b border-border flex items-center justify-between px-5 bg-muted/5 backdrop-blur-sm relative z-10 flex-shrink-0">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <div className="p-2 rounded-lg bg-primary/5 shadow-none border border-primary/10">
            <FileIcon type={selectedItem?.type || ''} className="h-5 w-5 text-primary" />
          </div>
          <div className="overflow-hidden flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 text-foreground">
              {isRenaming ? (
                <div className="flex items-center gap-2 group/rename max-w-lg w-full">
                  <Input
                    ref={renameInputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') setIsRenaming(false)
                    }}
                    onBlur={handleRename}
                    className="h-8 text-[13px] font-bold px-3 rounded-lg border-primary shadow-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Button 
                    size="icon" 
                    variant="default" 
                    className="h-7 w-7 rounded-lg shrink-0 shadow-none border-none"
                    onClick={handleRename}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group/title overflow-hidden">
                  <h3 className="text-[14px] font-bold truncate tracking-tight">{selectedItem?.name}</h3>
                  {can('UPDATE', resourceKey, selectedItem) && (
                    <button 
                      onClick={() => setIsRenaming(true)}
                      className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-primary/10 rounded-lg transition-all text-primary/70 hover:text-primary shadow-none"
                      title="Rename Asset"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!can('UPDATE', resourceKey, selectedItem) && (
                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-bold border-orange-500/30 text-orange-600 bg-orange-50/50 flex items-center gap-1.5 shrink-0 rounded-full">
                      <Lock className="h-2.5 w-2.5" />
                      READ ONLY
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {!isRenaming && (
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70 font-semibold tracking-tight mt-0.5">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary/40" /> {new Date(selectedItem?.updatedAt || '').toLocaleString()}</span>
                <span className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 text-primary/40" /> {((selectedItem?.size || 0) / 1024).toFixed(1)} KB</span>
                <span className="flex items-center gap-1.5 text-primary/80 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  <UserIcon className="h-3 w-3" /> 
                  {selectedItem?.creator?.name || selectedItem?.creator?.email || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full hover:bg-muted shadow-none transition-colors"
            onClick={() => {
              setSelectedId(null)
              setEditedContent('')
            }}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {(can('UPDATE', resourceKey, selectedItem) || can('DELETE', resourceKey, selectedItem)) && (
            <div className="w-px h-6 bg-border mx-1" />
          )}

          {can('DELETE', resourceKey, selectedItem) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-4 rounded-xl text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5 font-bold text-[11px] tracking-wide transition-all gap-2.5 shadow-none"
              onClick={() => setDeleteId(selectedId)}
            >
              <Trash2 className="h-4 w-4" />
              DELETE
            </Button>
          )}

          {can('UPDATE', resourceKey, selectedItem) && (
            <Button
              size="sm"
              className="h-9 px-6 rounded-xl bg-primary text-white font-black text-[11px] tracking-[0.1em] transition-all gap-2.5 hover:scale-[0.98] shadow-none border-none active:scale-[0.98]"
              disabled={isUpdatePending || !editedContent}
              onClick={handleSave}
            >
              {isUpdatePending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4" />}
              SAVE CHANGES
            </Button>
          )}
        </div>
      </div>

      <div className="h-10 border-b border-border/40 bg-muted/5 flex items-center justify-between px-5 relative z-10 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2.5 rounded-lg text-[10px] font-bold gap-2 transition-all shadow-none",
              isWrapping ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            onClick={() => setIsWrapping(!isWrapping)}
          >
            <WrapText className="h-3.5 w-3.5" />
            WRAPPING: {isWrapping ? 'ON' : 'OFF'}
          </Button>
          <div className="w-px h-3.5 bg-border/60 mx-1.5" />
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2.5 rounded-lg text-[10px] font-bold gap-2 transition-all shadow-none",
              isAllCollapsed ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            onClick={handleToggleFold}
          >
            {isAllCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {isAllCollapsed ? 'EXPAND ALL' : 'COLLAPSE ALL'}
          </Button>
        </div>

        <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-3 rounded-lg text-[10px] font-bold gap-2 transition-all shadow-none",
              isCopied ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            onClick={handleCopy}
          >
            {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? 'COPIED!' : 'COPY CODE'}
        </Button>
      </div>

      <div className={cn("flex-1 relative flex flex-col min-h-0 overflow-hidden", theme === 'dark' ? 'bg-[#0f1115]' : 'bg-[#fafafa]')}>
        {isLoadingDetail ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Fetching Buffer</span>
            </div>
          </div>
        ) : (
          <TypedCodeMirror
            ref={editorRef}
            value={editedContent}
            height="100%"
            theme={theme === 'dark' ? 'dark' : 'light'}
            className="flex-1 min-h-0 overflow-hidden text-[13px] border-0 outline-none h-full"
            style={{ height: '100%' }}
            extensions={[
              selectedItem?.type === 'XML' ? xml() : json(),
              ...(isWrapping ? [EditorView.lineWrapping] : []),
              EditorView.editable.of(can('UPDATE', resourceKey, selectedItem)),
              EditorView.theme({
                "&": { height: "100%" },
                ".cm-scroller": { overflow: "auto" }
              })
            ]}
            onChange={(value) => setEditedContent(value)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: true,
            }}
          />
        )}
      </div>
    </div>
  )
}
