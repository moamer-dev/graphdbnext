'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { AlertTriangle } from 'lucide-react'

interface WorkflowChangeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentWorkflowName: string
  newWorkflowName: string
  onConfirm: (updateCurrent: boolean) => void
  onCancel: () => void
}

export function WorkflowChangeConfirmDialog({
  open,
  onOpenChange,
  currentWorkflowName,
  newWorkflowName,
  onConfirm,
  onCancel
}: WorkflowChangeConfirmDialogProps) {
  const handleUpdate = () => {
    onConfirm(true)
    onOpenChange(false)
  }

  const handleSkip = () => {
    onConfirm(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Unsaved Workflow Changes</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You have unsaved changes to the current workflow <strong>&quot;{currentWorkflowName}&quot;</strong>.
            <br /><br />
            Would you like to update the current workflow before switching to <strong>&quot;{newWorkflowName}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            Don&apos;t Update
          </Button>
          <Button
            onClick={handleUpdate}
            className="w-full sm:w-auto"
          >
            Update & Switch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

