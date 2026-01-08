'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Copy, Check, Download } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

interface GraphResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  graph: Array<Record<string, unknown>>
  title?: string
}

export function GraphResultModal({ 
  open, 
  onOpenChange, 
  graph, 
  title = 'Graph Result' 
}: GraphResultModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(graph, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const json = JSON.stringify(graph, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph-result.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const previewItems = graph.slice(0, 50)
  const hasMore = graph.length > 50

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Generated graph with {graph.length} {graph.length === 1 ? 'item' : 'items'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Graph Data</span>
              <span className="text-[10px] text-muted-foreground">
                {hasMore ? `Showing first ${previewItems.length} of ${graph.length} items` : `${graph.length} items`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-muted/30 rounded">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {JSON.stringify(previewItems, null, 2)}
              {hasMore && (
                <span className="text-muted-foreground italic">
                  {'\n\n... and ' + (graph.length - previewItems.length) + ' more items'}
                </span>
              )}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

