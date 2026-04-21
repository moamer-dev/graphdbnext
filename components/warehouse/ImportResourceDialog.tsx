'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  CloudUpload, 
  FileJson, 
  FileCode, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  LayoutDashboard
} from 'lucide-react'
import { DataSourceType, Workspace } from '@prisma/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Handlers
import { useDataSourceImport } from '@/app/dashboard/data-sources/(handlers)/useDataSourceImport'

interface ImportResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportResourceDialog({ open, onOpenChange }: ImportResourceDialogProps) {
  const {
    files,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    isDragActive,
    setIsDragActive,
    workspaces,
    isLoadingWorkspaces,
    onFileSelect,
    processFile,
    setFiles,
    removeFile,
    handleUpload,
    isUploading,
    activeWorkspaceId,
    getMatchedStorage
  } = useDataSourceImport(open, onOpenChange)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-5 bg-gradient-to-br from-primary/[0.03] to-transparent border-b border-primary/10">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <CloudUpload className="h-5 w-5 text-primary" />
            Import Resources
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground mt-1">
            XML or JSON schema definitions.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-5 bg-white">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5 px-1">
                <LayoutDashboard className="h-3 w-3" />
                Target Destination
            </label>
            <Select 
                value={selectedWorkspaceId || 'none'} 
                onValueChange={(val) => setSelectedWorkspaceId(val === 'none' ? null : val)}
            >
              <SelectTrigger className="w-full h-10 rounded-xl bg-white border border-primary/10 hover:border-primary/30 focus:ring-2 focus:ring-primary/5 transition-all shadow-none text-xs font-bold px-4">
                <SelectValue placeholder="Select target workspace..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 bg-white shadow-xl p-1">
                <SelectItem value="none" className="text-xs font-bold py-2 rounded-lg">
                    Global Warehouse
                </SelectItem>
                {isLoadingWorkspaces ? (
                    <div className="p-2 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                ) : workspaces.map((ws: Workspace) => (
                    <SelectItem key={ws.id} value={ws.id} className="text-xs font-bold py-2 rounded-lg">
                        {ws.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedWorkspaceId && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100/50">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    <p className="text-[9px] text-amber-700 font-bold">
                        Personal global scope.
                    </p>
                </div>
            )}
          </div>

          <div 
            className={`
              relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 group
              ${isDragActive ? 'border-primary bg-primary/[0.03]' : 'border-primary/10 bg-primary/[0.01] hover:border-primary/20'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={async (e) => {
              e.preventDefault()
              setIsDragActive(false)
              const droppedFiles = Array.from(e.dataTransfer.files)
              const newFiles = await Promise.all(droppedFiles.map(processFile))
              setFiles(prev => [...prev, ...newFiles])
            }}
          >
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              onChange={onFileSelect}
              accept=".json,.xml"
            />
            <div className="flex flex-col items-center justify-center text-center gap-3 relative z-0 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="p-3 bg-white shadow-none border border-primary/5 rounded-xl group-hover:scale-105 transition-transform duration-500 ring-1 ring-primary/5">
                <CloudUpload className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Click or drag files</p>
                <p className="text-[10px] text-muted-foreground font-bold opacity-60">XML and JSON (max 10MB)</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {files.map((f, i) => (
                <div 
                  key={i} 
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-primary/5 bg-white hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg text-white ${f.type === DataSourceType.XML ? 'bg-orange-500' : 'bg-primary'}`}>
                      {f.type === DataSourceType.XML ? <FileCode className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold truncate text-foreground">{f.file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase">
                            {(f.file.size / 1024).toFixed(1)} KB • {f.type}
                        </span>
                        {(() => {
                           const matched = getMatchedStorage(f.file, f.type)
                           if (!matched) return null
                           return (
                             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10">
                                <span className="text-[8px] font-black text-primary uppercase whitespace-nowrap">
                                  Routing: {matched.name}
                                </span>
                             </div>
                           )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {f.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {f.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {f.status === 'idle' && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg hover:bg-destructive/5 hover:text-destructive transition-colors shadow-none"
                            onClick={() => removeFile(i)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t border-border/30 gap-2">
          <Button 
            variant="ghost" 
            className="h-9 rounded-xl font-bold text-xs px-4 hover:bg-primary/5 shadow-none"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="h-9 px-6 rounded-xl bg-primary text-white text-xs font-bold  hover:bg-primary/90 transition-all disabled:opacity-50 shadow-none border-none"
            disabled={files.length === 0 || files.every(f => f.status === 'success' || f.status === 'uploading')}
            onClick={handleUpload}
          >
            {isUploading ? (
                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : <CloudUpload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
