'use client'

import { useState, useRef, useEffect } from 'react'
import { FileCode, Upload, Eye, CheckCircle2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { useXmlSources, useDataSourcesStore } from '../../../stores/dataSourcesStore'
import { useModelBuilderStore } from '../../../stores/modelBuilderStore'
import { cn } from '../../../utils/cn'
import { toast } from 'sonner'
import type { DataSourcesPersistence } from '../../ModelBuilder'

interface DataSourcesPaletteSectionProps {
  className?: string
  xmlContent?: string
  setXmlContent?: (content: string) => void
  xmlPanelOpen?: boolean
  setXmlPanelOpen?: (open: boolean) => void
  onSelectWorkspaceXml?: (source: any) => void
  onUploadXml?: (file: File) => void
  dataSourcesPersistence?: DataSourcesPersistence
}

export function DataSourcesPaletteSection({
  className,
  xmlContent,
  setXmlContent,
  xmlPanelOpen,
  setXmlPanelOpen,
  onSelectWorkspaceXml,
  onUploadXml,
  dataSourcesPersistence
}: DataSourcesPaletteSectionProps) {
  const sources = useXmlSources()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredSources = (sources || []).filter((s: any) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const meta = useModelBuilderStore.getState().metadata
    if (meta?.selectedXmlName || meta?.selectedXmlId) {
      const match = (sources || []).find((s: any) =>
        s.id === meta.selectedXmlId || s.name === meta.selectedXmlName
      )
      if (match) {
        setActiveSourceId(match.id || match.name)
      } else if (meta.selectedXmlName) {
        setActiveSourceId(meta.selectedXmlName)
      }
    }
  }, [sources])

  const handleFileSelect = async (source: any) => {
    setActiveSourceId(source.id || source.name)
    let content = source.content
    if (!content && source.fileUrl) {
      try {
        const res = await fetch(source.fileUrl)
        if (res.ok) content = await res.text()
      } catch (e) {
        console.error('Failed to fetch file content', e)
      }
    }

    if (content) {
      useModelBuilderStore.getState().updateMetadata({
        selectedXmlName: source.name,
        selectedXmlId: source.id,
        xmlContent: content
      })
    }

    if (onSelectWorkspaceXml) {
      await onSelectWorkspaceXml(source)
      setXmlPanelOpen?.(true)
    } else {
      if (content && setXmlContent) {
        setXmlContent(content)
        setXmlPanelOpen?.(true)
        toast.success(`Loaded "${source.name}" in XML Editor`)
      }
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      if (setXmlContent) setXmlContent(text)
      setXmlPanelOpen?.(true)

      useModelBuilderStore.getState().updateMetadata({
        selectedXmlName: file.name,
        xmlContent: text
      })

      if (onUploadXml) {
        onUploadXml(file)
      }

      // Optimistically update store so file immediately shows in library
      useDataSourcesStore.getState().setSource({
        name: file.name,
        type: 'XML',
        content: text,
        size: file.size
      })

      if (dataSourcesPersistence?.onSave) {
        await dataSourcesPersistence.onSave({
          name: file.name,
          type: 'XML',
          content: text,
          size: file.size
        })

        if (dataSourcesPersistence.onLoad) {
          const freshSources = await dataSourcesPersistence.onLoad()
          if (freshSources) {
            useDataSourcesStore.getState().setSources(freshSources)
          }
        }
        toast.success(`Uploaded "${file.name}" to Data Sources`)
      } else {
        toast.success(`Loaded "${file.name}" in XML Editor`)
      }
    } catch (err) {
      console.error('Error uploading XML file:', err)
      toast.error('Failed to save XML file')
    }
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={handleUploadFile}
        className="hidden"
      />

      <div className="p-3 border-b space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Data Assets (XML)</span>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
            {sources.length}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-8 text-xs font-medium border-dashed hover:border-primary/50 hover:bg-primary/5"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5 text-primary" />
          Upload XML File
        </Button>

        <Input
          placeholder="Search XML files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredSources.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <FileCode className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium text-xs">No XML files found</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Click &quot;Upload XML File&quot; above to add XML data sources to this workspace.
            </p>
          </div>
        ) : (
          filteredSources.map((source: any) => {
            const isActive = activeSourceId === (source.id || source.name)
            return (
              <div
                key={source.id || source.name}
                onClick={() => handleFileSelect(source)}
                className={cn(
                  "group p-2.5 rounded-lg border transition-all cursor-pointer space-y-2",
                  isActive
                    ? "bg-primary/5 border-primary shadow-xs"
                    : "bg-background border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <div className={cn(
                      "p-1.5 rounded shrink-0",
                      isActive ? "bg-primary/10 text-primary" : "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
                    )}>
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{source.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {source.size ? `${(source.size / 1024).toFixed(1)} KB` : 'Workspace Asset'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="hidden group-hover:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <Eye className="h-3 w-3" />
                        Open
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
