'use client'

import { useState } from 'react'
import { PlayCircle, Loader2, ClipboardList, Download, Database, ChevronDown, Sparkles, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import type { Node } from '../../types'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { exportDataToTtl, exportDataToRdf } from '../../utils/rdfExportUtils'
import { useSemanticValidation } from '../../hooks/semantic/useSemanticValidation'

interface RunWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: Node[]
  rootNodeId: string | null
  onRootNodeIdChange: (id: string | null) => void
  xmlFile: File | null
  onXmlFileChange: (file: File | null) => void
  xmlFileFromWizard: File | null
  running: boolean
  graphPreview: {
    items: Array<Record<string, unknown>>
    fullGraph: Array<Record<string, unknown>>
  } | null
  xmlContent?: string
  onRun: () => void
  onPushToDB?: (graph: Array<Record<string, unknown>>) => Promise<void>
}

export function RunWorkflowDialog({
  open,
  onOpenChange,
  nodes,
  rootNodeId,
  onRootNodeIdChange,
  xmlFile,
  onXmlFileChange,
  xmlFileFromWizard,
  running,
  graphPreview,
  xmlContent,
  onRun,
  onPushToDB
}: RunWorkflowDialogProps) {
  const [isPushing, setIsPushing] = useState(false)
  const { report, isSemanticEnabled } = useSemanticValidation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Graph (Workflow)</DialogTitle>
          <DialogDescription>
            Provide the source XML and run the current workflows against the loaded schema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isSemanticEnabled && !report.overallValid && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Semantic Validation Incomplete</p>
                <p className="text-xs leading-relaxed opacity-90">
                  The semantic layer is enabled but not fully mapped. 
                  Building the graph now will result in missing or incorrect semantic metadata.
                </p>
              </div>
            </div>
          )}
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">XML Source</Label>
            {xmlFileFromWizard || xmlFile ? (
              <div className="mt-2 p-4 bg-primary/[0.03] rounded-xl border border-primary/10 transition-all animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold truncate text-foreground/90">{xmlFileFromWizard?.name || xmlFile?.name}</p>
                       <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black tracking-tighter bg-amber-50 text-amber-700 border-amber-200 uppercase shrink-0">
                         Live Buffer
                       </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                      {xmlFileFromWizard ? 'Imported from Wizard' : 'Selected from Library'} • {(((xmlFileFromWizard?.size || xmlFile?.size || 0) / 1024).toFixed(1))} KB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground font-medium italic">No XML file selected. Please upload a file to proceed with the graph generation.</p>
                <div className="relative group">
                   <div className="absolute inset-0 bg-primary/5 rounded-lg border border-dashed border-primary/20 group-hover:border-primary/40 transition-all" />
                   <Input
                    type="file"
                    accept=".xml"
                    onChange={(e) => onXmlFileChange(e.target.files?.[0] || null)}
                    className="opacity-0 w-full h-24 cursor-pointer relative z-10"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Download className="h-6 w-6 text-primary/40 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-primary/60">Click to upload XML file</p>
                    <p className="text-[10px] text-muted-foreground mt-1">.xml files only</p>
                  </div>
                </div>
              </div>
            )}
          <div className="space-y-2">
            <Label>Root Node (Starter)</Label>
            <Select
              value={rootNodeId || '__root__'}
              onValueChange={(value) => {
                if (value === '__root__') {
                  onRootNodeIdChange(null)
                } else {
                  onRootNodeIdChange(value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Use XML root (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">Use XML root (default)</SelectItem>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a node to start the workflow from. If not selected, the workflow will start from the XML root element.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onRun}
              disabled={(!xmlFileFromWizard && !xmlFile) || running}
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              Run
            </Button>
          </div>

          {graphPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-sm font-semibold">Preview</span>
                  <span className="text-xs text-muted-foreground">
                    Showing first {graphPreview.items.length} of {graphPreview.fullGraph.length} entries
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Actions
                        <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Graph Operations</DropdownMenuLabel>
                      {onPushToDB && (
                        <DropdownMenuItem
                          disabled={isPushing}
                          onSelect={async () => {
                            if (!onPushToDB) return
                            setIsPushing(true)
                            try {
                              await onPushToDB(graphPreview.fullGraph)
                            } finally {
                              setIsPushing(false)
                            }
                          }}
                        >
                          {isPushing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                          ) : (
                            <Database className="h-3.5 w-3.5 mr-2 text-primary" />
                          )}
                          Push to Graph DB
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Export Results</DropdownMenuLabel>
                      <DropdownMenuItem
                        onSelect={() => {
                          const json = JSON.stringify(graphPreview.fullGraph, null, 2)
                          const blob = new Blob([json], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'graph.json'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-2" /> Export JSON
                      </DropdownMenuItem>
                      
                      {useModelBuilderStore.getState().isSemanticEnabled && (
                        <>
                          <DropdownMenuItem
                            onSelect={() => {
                              const state = useModelBuilderStore.getState()
                              const ttl = exportDataToTtl(state, graphPreview.fullGraph)
                              const blob = new Blob([ttl], { type: 'text/turtle' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'graph_data.ttl'
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-2" /> Export TTL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              const state = useModelBuilderStore.getState()
                              const rdf = exportDataToRdf(state, graphPreview.fullGraph)
                              const blob = new Blob([rdf], { type: 'application/rdf+xml' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'graph_data.rdf'
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-2" /> Export RDF
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="max-h-64 overflow-auto rounded border bg-muted/30 text-xs p-2">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(graphPreview.items, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
