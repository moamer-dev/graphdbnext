'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, Calendar, User } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Model } from '@/lib/resources/ModelResource'

interface ModelCardProps {
  model: Model
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

export function ModelCard ({ model, onView, onEdit, onDelete }: ModelCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await onDelete(model.id)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  return (
    <>
    <Card className="gradient-card hover-lift cursor-pointer border border-border/50 shadow-sm" onClick={() => onView(model.id)}>
      <CardHeader className="pb-2.5 px-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate tracking-tight">{model.name}</CardTitle>
            {model.description && (
              <CardDescription className="text-xs mt-0.5 line-clamp-2 text-muted-foreground/80">
                {model.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-7 w-7 p-0 shrink-0 hover:bg-muted/60">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="gradient-card border border-border/50">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(model.id) }} className="text-xs">
                <Eye className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(model.id) }} className="text-xs">
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive text-xs"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border/50 bg-muted/30">
              v{model.version}
            </Badge>
          </div>
          <div className="space-y-0.5 text-[11px] text-muted-foreground/70">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 opacity-60" />
              <span>Created {new Date(model.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 opacity-60" />
              <span>Updated {new Date(model.updatedAt).toLocaleDateString()}</span>
            </div>
            {model.user && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 opacity-60" />
                <span className="truncate">{model.user.email}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Model"
        description={`Are you sure you want to delete "${model.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </>
  )
}

