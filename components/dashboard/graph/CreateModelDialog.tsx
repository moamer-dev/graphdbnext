'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ModelResource } from '@/resources/ModelResource'

interface CreateModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (modelId: string) => void
}

export function CreateModelDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateModelDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Model name is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          version: '1.0.0',
          schemaJson: {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            source: name.trim(),
            nodes: {},
            relations: {}
          }
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create model')
      }

      const result = await res.json()
      const createdModel = result.data || result

      toast.success(`Model "${createdModel.name}" created successfully`)
      onOpenChange(false)
      setName('')
      setDescription('')

      if (onSuccess) {
        onSuccess(createdModel.id)
      } else if (createdModel.id) {
        router.push(ModelResource.EDIT_PATH(createdModel.id))
      }
    } catch (err: any) {
      console.error('Error creating model:', err)
      toast.error(err.message || 'Failed to create model')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Schema Model
            </DialogTitle>
            <DialogDescription>
              Enter a name and description for your new graph schema model.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-model-name">
                Model Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-model-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. TEI Manuscripts Knowledge Model"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-model-desc">Description (Optional)</Label>
              <Textarea
                id="create-model-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this graph model..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Open Builder'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
