import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Loader2, Share2 } from 'lucide-react'

interface SaveXmlToWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  setName: (name: string) => void
  onConfirm: () => void
  isLoading: boolean
}

export const SaveXmlToWorkspaceDialog: React.FC<SaveXmlToWorkspaceDialogProps> = ({
  open,
  onOpenChange,
  name,
  setName,
  onConfirm,
  isLoading
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Push to Workspace Library
          </DialogTitle>
          <DialogDescription>
            Give your structural definition a name to help others find it in the Workspace Library.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="xml-name" className="text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">
              Resource Name
            </Label>
            <Input
              id="xml-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. core-ontology-v1.xml"
              className="h-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !isLoading) {
                  onConfirm()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-xl font-bold h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!name.trim() || isLoading}
            className="rounded-xl font-black bg-primary text-primary-foreground h-10 px-8 flex items-center gap-2 transition-all hover:scale-[0.98] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            PUSH TO LIBRARY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
