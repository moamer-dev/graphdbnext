'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Play, Edit2, Trash2 } from 'lucide-react'
import { useSavedQueries } from '../../hooks/query/useSavedQueries'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { SavedQuery } from '@/lib/resources/SavedQueryResource'

interface SavedQueriesProps {
  onQuerySelect: (query: string) => void
  onExecute?: (query: string) => void
}

export function SavedQueries ({ onQuerySelect, onExecute }: SavedQueriesProps) {
  const {
    selectedQuery,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    saveDialogOpen,
    setSaveDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    saveFormData,
    setSaveFormData,
    categories,
    filteredQueries,
    handleSaveQuery,
    handleOpenEditDialog,
    handleDeleteQuery,
    handleUseQuery,
    handleExecuteQuery,
    isLoading
  } = useSavedQueries({ onQuerySelect, onExecute })

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean
    query: SavedQuery | null
  }>({ open: false, query: null })

  const handleDeleteClick = (query: SavedQuery) => {
    setDeleteConfirmDialog({ open: true, query })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmDialog.query) {
      await handleDeleteQuery(deleteConfirmDialog.query.id)
      setDeleteConfirmDialog({ open: false, query: null })
    }
  }

  return (
    <div className="space-y-3">
      {/* Search and Filter */}
      <div className="space-y-2">
        <Input
          placeholder="Search queries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />
        {categories.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Queries List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading queries...</div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No queries match your filters' 
              : 'No saved queries yet'}
          </div>
        ) : (
          filteredQueries.map((query) => (
            <div
              key={query.id}
              className={cn(
                "p-3 rounded-md border cursor-pointer transition-colors",
                selectedQuery?.id === query.id 
                  ? "bg-primary/10 border-primary" 
                  : "bg-background hover:bg-muted"
              )}
              onClick={() => handleUseQuery(query)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{query.name}</h4>
                    {query.category && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {query.category}
                      </Badge>
                    )}
                    {query.source && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {query.source}
                      </Badge>
                    )}
                  </div>
                  {query.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {query.description}
                    </p>
                  )}
                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap line-clamp-2">
                    {query.query}
                  </pre>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {query.executionCount && (
                      <span>Executed {query.executionCount}x</span>
                    )}
                    {query.updatedAt && (
                      <span>Updated {new Date(query.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEditDialog(query)
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(query)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {onExecute && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExecuteQuery(query)
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save your query for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={saveFormData.name}
                onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                placeholder="My Query"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={saveFormData.description}
                onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                placeholder="What does this query do?"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={saveFormData.category}
                onChange={(e) => setSaveFormData({ ...saveFormData, category: e.target.value })}
                placeholder="explore, search, analyze..."
              />
            </div>
            <div className="space-y-2">
              <Label>Query *</Label>
              <Textarea
                value={saveFormData.query}
                onChange={(e) => setSaveFormData({ ...saveFormData, query: e.target.value })}
                placeholder="MATCH (n) RETURN n"
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuery}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Query</DialogTitle>
            <DialogDescription>
              Update your saved query
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={saveFormData.name}
                onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                placeholder="My Query"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={saveFormData.description}
                onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                placeholder="What does this query do?"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={saveFormData.category}
                onChange={(e) => setSaveFormData({ ...saveFormData, category: e.target.value })}
                placeholder="explore, search, analyze..."
              />
            </div>
            <div className="space-y-2">
              <Label>Query *</Label>
              <Textarea
                value={saveFormData.query}
                onChange={(e) => setSaveFormData({ ...saveFormData, query: e.target.value })}
                placeholder="MATCH (n) RETURN n"
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuery}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.query && (
        <ConfirmDialog
          open={deleteConfirmDialog.open}
          onOpenChange={(open) => setDeleteConfirmDialog({ open, query: null })}
          onConfirm={handleConfirmDelete}
          title="Delete Query"
          description={`Are you sure you want to delete "${deleteConfirmDialog.query.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
        />
      )}
    </div>
  )
}

