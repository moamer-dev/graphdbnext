'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Search, FileText, Settings, Link2, Globe, Boxes } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchResult {
  id: string
  type: 'node' | 'tool' | 'action' | 'relationship'
  label: string
  description?: string
  category?: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
}

interface QuickSearchProps {
  nodes?: Array<{ id: string; label: string; type: string }>
  tools?: Array<{ id: string; label: string; type: string }>
  actions?: Array<{ id: string; label: string; type: string }>
  relationships?: Array<{ id: string; type: string; from: string; to: string }>
  onSelectNode?: (id: string) => void
  onSelectTool?: (id: string) => void
  onSelectAction?: (id: string) => void
  onSelectRelationship?: (id: string) => void
}

export function QuickSearch({
  nodes = [],
  tools = [],
  actions = [],
  relationships = [],
  onSelectNode,
  onSelectTool,
  onSelectAction,
  onSelectRelationship
}: QuickSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search nodes
    nodes.forEach(node => {
      if (
        node.label.toLowerCase().includes(lowerQuery) ||
        node.type.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: node.id,
          type: 'node',
          label: node.label,
          description: `Node: ${node.type}`,
          icon: FileText,
          onClick: () => {
            onSelectNode?.(node.id)
            setOpen(false)
            setQuery('')
          }
        })
      }
    })

    // Search tools
    tools.forEach(tool => {
      if (
        tool.label.toLowerCase().includes(lowerQuery) ||
        tool.type.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: tool.id,
          type: 'tool',
          label: tool.label,
          description: `Tool: ${tool.type}`,
          icon: Settings,
          onClick: () => {
            onSelectTool?.(tool.id)
            setOpen(false)
            setQuery('')
          }
        })
      }
    })

    // Search actions
    actions.forEach(action => {
      if (
        action.label.toLowerCase().includes(lowerQuery) ||
        action.type.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: action.id,
          type: 'action',
          label: action.label,
          description: `Action: ${action.type}`,
          icon: Boxes,
          onClick: () => {
            onSelectAction?.(action.id)
            setOpen(false)
            setQuery('')
          }
        })
      }
    })

    // Search relationships
    relationships.forEach(rel => {
      if (rel.type.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: rel.id,
          type: 'relationship',
          label: rel.type,
          description: `Relationship: ${rel.from} → ${rel.to}`,
          icon: Link2,
          onClick: () => {
            onSelectRelationship?.(rel.id)
            setOpen(false)
            setQuery('')
          }
        })
      }
    })

    return searchResults.slice(0, 20) // Limit to 20 results
  }, [query, nodes, tools, actions, relationships, onSelectNode, onSelectTool, onSelectAction, onSelectRelationship])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Search</DialogTitle>
          <DialogDescription>
            Search for nodes, tools, actions, and relationships. Press Esc to close.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {results.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {query ? 'No results found' : 'Start typing to search...'}
              </div>
            ) : (
              results.map((result) => {
                const Icon = result.icon || FileText
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={result.onClick}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                      'hover:bg-muted/50 hover:border-primary/50',
                      'flex items-center gap-3'
                    )}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.label}</div>
                      {result.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {result.type}
                    </Badge>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

