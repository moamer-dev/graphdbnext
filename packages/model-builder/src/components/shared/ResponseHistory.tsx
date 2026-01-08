'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { History, X, Copy, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ResponseHistoryEntry {
  id: string
  timestamp: number
  toolId: string
  toolLabel: string
  response: unknown
  params?: Record<string, unknown>
}

interface ResponseHistoryProps {
  entries: ResponseHistoryEntry[]
  onSelect?: (entry: ResponseHistoryEntry) => void
  onClear?: () => void
}

export function ResponseHistory({
  entries,
  onSelect,
  onClear
}: ResponseHistoryProps) {
  const [open, setOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (entry: ResponseHistoryEntry) => {
    navigator.clipboard.writeText(JSON.stringify(entry.response, null, 2))
    setCopiedId(entry.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-xs"
      >
        <History className="h-3 w-3 mr-1" />
        History ({entries.length})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Response History</DialogTitle>
            <DialogDescription>
              View previous API responses. Click on an entry to view details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No response history yet
              </div>
            ) : (
              <>
                {onClear && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                    className="w-full"
                  >
                    Clear History
                  </Button>
                )}
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-colors',
                          'hover:bg-muted/50 hover:border-primary/50'
                        )}
                        onClick={() => {
                          onSelect?.(entry)
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {entry.toolLabel}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(entry.timestamp)}
                            </div>
                            {entry.params && (
                              <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                                {JSON.stringify(entry.params)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(entry)
                            }}
                            className="h-7 w-7 p-0"
                          >
                            {copiedId === entry.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

