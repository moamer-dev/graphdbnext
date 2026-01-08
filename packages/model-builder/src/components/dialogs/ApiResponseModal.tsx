'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { ApiResponseViewer } from '../viewer/ApiResponseViewer'

interface ApiResponseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: unknown
  title?: string
  onFieldSelect?: (path: string) => void
}

export function ApiResponseModal({ 
  open, 
  onOpenChange, 
  data, 
  title = 'API Response',
  onFieldSelect 
}: ApiResponseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            View the API response data. Click on any field to copy its expression for use in actions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0">
          <ApiResponseViewer
            data={data}
            title={title}
            className="h-full"
            onFieldSelect={onFieldSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

