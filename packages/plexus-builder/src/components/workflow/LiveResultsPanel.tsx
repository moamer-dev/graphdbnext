'use client'

import { useState } from 'react'
import { X, Network, Table, Code, Search, CheckCircle2, Download, Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../utils/cn'
import { toast } from 'sonner'

interface LiveResultsPanelProps {
  graphPreview: {
    items: any[]
    fullGraph?: any[]
  } | null
  onClose: () => void
  className?: string
}

export function LiveResultsPanel({ graphPreview, onClose, className }: LiveResultsPanelProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'table' | 'json'>('graph')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const items = graphPreview?.fullGraph || graphPreview?.items || []

  const filteredItems = items.filter(item => {
    const text = JSON.stringify(item).toLowerCase()
    return text.includes(searchQuery.toLowerCase())
  })

  // Group items by type/label
  const groupedItems = filteredItems.reduce((acc: Record<string, any[]>, item: any) => {
    const type = item.type || item.label || item.entityType || 'Node'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {})

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2))
      setIsCopied(true)
      toast.success('Results JSON copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy JSON')
    }
  }

  return (
    <div className={cn("h-full flex flex-col bg-background border-l shadow-sm", className)}>
      {/* Header */}
      <div className="p-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">Live Graph Results</h3>
            <p className="text-[10px] text-muted-foreground">
              {items.length} graph {items.length === 1 ? 'node' : 'nodes'} generated
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="p-2 border-b bg-muted/5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md border">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={cn(
              "px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 transition-all",
              viewMode === 'graph' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Network className="h-3 w-3" />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              "px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 transition-all",
              viewMode === 'table' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Table className="h-3 w-3" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('json')}
            className={cn(
              "px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 transition-all",
              viewMode === 'json' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="h-3 w-3" />
            JSON
          </button>
        </div>

        <div className="relative flex-1 max-w-[180px]">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <Network className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-xs font-medium">No results generated yet</p>
            <p className="text-[11px]">Click &quot;Build Graph&quot; to execute your workflow on XML data.</p>
          </div>
        ) : viewMode === 'graph' ? (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([type, nodes]) => (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b pb-1">
                  <span>{type}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{nodes.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {nodes.map((node: any, idx: number) => (
                    <div
                      key={node.id || idx}
                      className="p-2 rounded border bg-card hover:border-primary/40 transition-all text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground truncate">{node.name || node.label || node.id || `Node #${idx + 1}`}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{node.id}</span>
                      </div>
                      {node.attributes && Object.keys(node.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Object.entries(node.attributes).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              <strong className="text-foreground">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-muted-foreground border-b text-[11px]">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">ID / Label</th>
                  <th className="p-2">Attributes / Properties</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-muted/10">
                    <td className="p-2 font-semibold text-primary">{item.type || item.label || 'Node'}</td>
                    <td className="p-2 font-mono text-[11px]">{item.id || item.name || '-'}</td>
                    <td className="p-2 text-[11px] text-muted-foreground">
                      {item.attributes ? JSON.stringify(item.attributes) : JSON.stringify(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={handleCopyJson} className="h-7 text-xs gap-1">
                {isCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <pre className="p-3 bg-muted/20 border rounded-md text-[11px] font-mono overflow-x-auto max-h-[600px] text-foreground">
              {JSON.stringify(filteredItems, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
