'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2, FileCode } from 'lucide-react'
import { useModelUpload } from '@/hooks/model/useModelUpload'
import { downloadTemplate } from '@/utils'
import { toast } from 'sonner'
import { cn } from '@/utils'

interface SchemaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SchemaUploadDialog({ open, onOpenChange, onSuccess }: SchemaUploadDialogProps) {
  const [modelName, setModelName] = useState('')
  const [modelDescription, setModelDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadModel, uploading } = useModelUpload()

  const handleFileUpload = async () => {
    if (!uploadFile || !modelName) {
      toast.error('Model name and file are required')
      return
    }

    try {
      await uploadModel({
        file: uploadFile,
        name: modelName,
        description: modelDescription || undefined
      })

      toast.success('Schema uploaded successfully')
      
      // Reset form
      setModelName('')
      setModelDescription('')
      setUploadFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload schema')
    }
  }

  const handleFileChange = (file: File | null) => {
    if (file && (file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.md'))) {
      setUploadFile(file)
    } else if (file) {
      toast.error('Only .json and .md files are supported')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            Upload Schema
          </DialogTitle>
          <DialogDescription className="text-sm">
            Initialize your graph model by uploading a Markdown or JSON schema file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Name *</Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Supply Chain Graph"
                className="h-10 focus-visible:ring-primary/20 transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="model-description"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                placeholder="What is the purpose of this schema model?"
                className="min-h-[100px] resize-none focus-visible:ring-primary/20 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schema File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              
              <div
                className={cn(
                  "relative mt-1 border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer",
                  isDragging 
                    ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
                    : "border-muted-foreground/20 bg-muted/5 hover:border-primary/50 hover:bg-muted/10",
                  uploadFile && "border-primary/30 bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  handleFileChange(e.dataTransfer.files?.[0] || null)
                }}
              >
                {uploadFile ? (
                   <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-primary/20">
                        <FileCode className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground max-w-[300px] truncate">{uploadFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB • Click to change</p>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className={cn(
                      "p-3 rounded-full bg-muted/20 transition-transform duration-200",
                      isDragging && "scale-110"
                    )}>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Upload or Drop Schema</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Select a .json or .md file from your computer
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4 py-2 border-t border-border/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadTemplate('md')
                  }}
                  className="text-[10px] h-7 font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  MD Template
                </Button>
                <div className="h-4 w-px bg-border/20" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadTemplate('json')
                  }}
                  className="text-[10px] h-7 font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  JSON Template
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleFileUpload}
            disabled={uploading || !modelName || !uploadFile}
            className="w-full font-bold h-9 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Initializing Model...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-3" />
                Deploy Schema
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
