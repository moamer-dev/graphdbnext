'use client'

import { useState } from 'react'
import { PlayCircle, Loader2, ClipboardList, Download, Database } from 'lucide-react'
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
import type { Node } from '../../types'

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
  onRun,
  onPushToDB
}: RunWorkflowDialogProps) {
  const [isPushing, setIsPushing] = useState(false)

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
          <div className="space-y-2">
            <Label>XML file</Label>
            {xmlFileFromWizard ? (
              <div className="p-3 bg-muted/50 rounded-lg border border-muted">
                <p className="text-xs text-muted-foreground mb-1">Using file from XML Import Wizard:</p>
                <p className="text-sm font-mono font-medium">{xmlFileFromWizard.name}</p>
                <p className="text-xs text-muted-foreground mt-2">You can also select a different file below:</p>
              </div>
            ) : null}
            <Input
              type="file"
              accept=".xml"
              onChange={(e) => onXmlFileChange(e.target.files?.[0] || null)}
            />
            {xmlFile && !xmlFileFromWizard && (
              <p className="text-xs text-muted-foreground">Selected: {xmlFile.name}</p>
            )}
          </div>
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
                  {onPushToDB && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!onPushToDB) return
                        setIsPushing(true)
                        try {
                          await onPushToDB(graphPreview.fullGraph)
                        } finally {
                          setIsPushing(false)
                        }
                      }}
                      disabled={isPushing}
                      className="h-7 text-xs"
                    >
                      {isPushing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                      Push to Graph DB
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
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
                    className="h-7 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export JSON
                  </Button>
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

