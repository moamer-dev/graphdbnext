'use client'

import { useRef } from 'react'
import { Upload, Loader2, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface ImportSchemaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importFile: File | null
  onImportFileChange: (file: File | null) => void
  importing: boolean
  importError: string | null
  onImport: () => void
}

export function ImportSchemaDialog({
  open,
  onOpenChange,
  importFile,
  onImportFileChange,
  importing,
  importError,
  onImport
}: ImportSchemaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Schema</DialogTitle>
          <DialogDescription>
            Import a JSON or Markdown schema file to populate the builder
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schema-file">Schema File (JSON or MD)</Label>
            <input
              id="schema-file"
              ref={fileInputRef}
              type="file"
              accept=".json,.md,.markdown"
              className="hidden"
              onChange={(e) => onImportFileChange(e.target.files?.[0] || null)}
            />
            <div
              className="mt-1 border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file && (file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.md'))) {
                  onImportFileChange(file)
                }
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-foreground">Upload or Drop Schema</p>
                <p className="text-[11px] text-muted-foreground">
                  Drag and drop a JSON or Markdown schema here, or click to browse.
                </p>
              </div>
              {importFile && (
                <p className="mt-1 text-[11px] text-muted-foreground truncate">
                  Selected: <span className="font-mono">{importFile.name}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/templates/schema-template.md'
                  link.download = 'schema-template.md'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                MD Template
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/templates/schema-template.json'
                  link.download = 'schema-template.json'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                JSON Template
              </Button>
            </div>
            {importError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {importError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: JSON schema (.json) or Markdown schema (.md)
            </p>
          </div>
          <Button
            onClick={onImport}
            disabled={importing || !importFile}
            className="w-full"
          >
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
      </DialogContent>
    </Dialog>
  )
}

