'use client'

import { useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface ImportWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowConfigFile: File | null
  onWorkflowConfigFileChange: (file: File | null) => void
  onImport: () => void
  importing?: boolean
  importError?: string | null
  onCancel?: () => void
}

export function ImportWorkflowDialog({
  open,
  onOpenChange,
  workflowConfigFile,
  onWorkflowConfigFileChange,
  onImport,
  importing = false,
  importError = null,
  onCancel
}: ImportWorkflowDialogProps) {
  const workflowConfigInputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Workflow Configuration</DialogTitle>
          <DialogDescription>
            Import relationships, tools, and actions from a JSON configuration file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-config-file">Workflow Configuration File (JSON)</Label>
            <input
              id="workflow-config-file"
              ref={workflowConfigInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => onWorkflowConfigFileChange(e.target.files?.[0] || null)}
            />
            <div
              className="mt-1 border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => workflowConfigInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file && file.name.toLowerCase().endsWith('.json')) {
                  onWorkflowConfigFileChange(file)
                }
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-foreground">Upload or Drop Workflow Configuration</p>
                <p className="text-[11px] text-muted-foreground">
                  Drag and drop a JSON workflow configuration file here, or click to browse.
                </p>
              </div>
              {workflowConfigFile && (
                <p className="mt-1 text-[11px] text-muted-foreground truncate">
                  Selected: <span className="font-mono">{workflowConfigFile.name}</span>
                </p>
              )}
            </div>
            {importError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {importError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported format: JSON workflow configuration (.json)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={importing}>
                Cancel
              </Button>
            )}
            <Button onClick={onImport} disabled={importing || !workflowConfigFile} className={onCancel ? '' : 'w-full'}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
