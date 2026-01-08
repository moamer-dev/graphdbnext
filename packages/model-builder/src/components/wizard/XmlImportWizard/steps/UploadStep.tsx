'use client'

import { useRef } from 'react'
import { Upload, FileText, Info } from 'lucide-react'
import { Button } from '../../../ui/button'

interface UploadStepProps {
  selectedFile: File | null
  onFileSelect: (file: File) => void
}

export function UploadStep({ selectedFile, onFileSelect }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900">
          <p className="font-medium mb-1">Getting Started</p>
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
    </div>
  )
}

