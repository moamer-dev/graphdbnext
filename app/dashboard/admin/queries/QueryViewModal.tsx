'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { SavedQuery } from '@/lib/resources/SavedQueryResource'
import { Calendar, User, Play, Tag, Code } from 'lucide-react'

interface QueryViewModalProps {
  query: SavedQuery
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueryViewModal ({ query, open, onOpenChange }: QueryViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {query.name}
          </DialogTitle>
          <DialogDescription>
            View saved query details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <p className="text-sm font-medium mt-1">{query.name}</p>
                </div>
                {query.category && (
                  <div>
                    <label className="text-xs text-muted-foreground">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">{query.category}</Badge>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground">Source</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {query.source}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Executions</label>
                  <p className="text-sm font-medium mt-1 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {query.executionCount || 0} times
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {query.description && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground">{query.description}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Query */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Query</h3>
              <div className="bg-muted rounded-md p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto">
                  {query.query}
                </pre>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            {query.tags && query.tags.length > 0 && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {query.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-xs text-muted-foreground">Created</label>
                    <p className="font-medium">
                      {new Date(query.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-xs text-muted-foreground">Updated</label>
                    <p className="font-medium">
                      {new Date(query.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {query.executedAt && (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs text-muted-foreground">Last Executed</label>
                      <p className="font-medium">
                        {new Date(query.executedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-xs text-muted-foreground">User ID</label>
                    <p className="font-medium font-mono text-xs">{query.userId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

