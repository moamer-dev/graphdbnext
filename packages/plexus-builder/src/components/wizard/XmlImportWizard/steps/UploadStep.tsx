'use client'

import { useRef } from 'react'
import { Upload, FileText, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../../utils/cn'

interface UploadStepProps {
  selectedFile: File | null
  onFileSelect: (file: File) => void
  workspaceXmls?: any[]
  onSelectWorkspaceXml?: (xmlSource: any) => void
}

export function UploadStep({ 
  selectedFile, 
  onFileSelect,
  workspaceXmls = [],
  onSelectWorkspaceXml
}: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2 mt-4">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-foreground/80">
          <p className="font-medium mb-1 text-primary">Getting Started</p>
          <p>Upload your XML file to begin. Supported formats include TEI, edXML, and other XML documents. The system will analyze the structure and help you map it to a graph database.</p>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onFileSelect(file)
          }
        }}
        className="hidden"
      />
      <div
        className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file && file.name.toLowerCase().endsWith('.xml')) {
            onFileSelect(file)
          }
        }}
      >
        <Upload className="h-16 w-16 text-primary" />
        <div>
          <h3 className="text-base font-semibold mb-1.5">Upload XML File</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop your XML file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: TEI, edXML, and other XML formats
          </p>
        </div>
        {selectedFile && (
          <div className="mt-4 px-4 py-2 bg-background border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Warehouse Selection */}
      {workspaceXmls.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-muted" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Or Select from Workspace Library</span>
            <div className="h-px flex-1 bg-muted" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {workspaceXmls.map((xml) => (
              <button
                key={xml.id}
                type="button"
                onClick={() => onSelectWorkspaceXml?.(xml)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                  selectedFile?.name === xml.name
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-background border-muted hover:border-primary/50 hover:bg-muted/5"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={cn(
                    "p-1.5 rounded-md",
                    selectedFile?.name === xml.name ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold truncate">{xml.name}</span>
                    <span className="text-[10px] text-muted-foreground">Workspace Asset</span>
                  </div>
                </div>
                {selectedFile?.name === xml.name && (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

