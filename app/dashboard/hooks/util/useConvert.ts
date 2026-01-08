import { useState } from 'react'
import { toast } from 'sonner'
import { useLoading } from './useLoading'
import { useToggle } from './useToggle'
import { useFileDownload } from './useFileDownload'

export interface GraphElement {
  id: number
  type: 'node' | 'relationship'
  labels?: string[]
  label?: string
  properties?: Record<string, unknown>
  start?: number
  end?: number
}

export function useConvert () {
  const { loading, withLoading } = useLoading()
  const { value: previewExpanded, toggle: togglePreview } = useToggle()
  const { downloadJSON } = useFileDownload()

  const [convertedGraph, setConvertedGraph] = useState<GraphElement[] | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setConvertedGraph(null)
    setOriginalFileName(null)

    await withLoading(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/xml2json', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (data.success) {
          setConvertedGraph(data.graph)
          setOriginalFileName(file.name)
          toast.success(`Conversion successful! Generated ${data.count} graph elements.`)
        } else {
          toast.error(data.error || 'Conversion failed')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        toast.error(errorMessage)
      } finally {
        event.target.value = ''
      }
    })
  }

  const downloadConvertedJSON = () => {
    if (!convertedGraph || !originalFileName) return
    downloadJSON(convertedGraph, originalFileName.replace('.xml', '.json'))
  }

  const loadToDatabase = async () => {
    if (!convertedGraph) return

    await withLoading(async () => {
      try {
        const response = await fetch('/api/database/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph: convertedGraph })
        })

        const data = await response.json()

        if (data.success) {
          toast.success(`Loaded ${data.nodesCreated} nodes and ${data.relationshipsCreated} relationships into the graph database`)
        } else {
          toast.error(data.error || 'Failed to load graph')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load graph'
        toast.error(errorMessage)
      }
    })
  }

  const stats = convertedGraph ? {
    total: convertedGraph.length,
    nodes: convertedGraph.filter(e => e.type === 'node').length,
    relationships: convertedGraph.filter(e => e.type === 'relationship').length
  } : null

  return {
    loading,
    convertedGraph,
    originalFileName,
    previewExpanded,
    stats,
    handleFileUpload,
    downloadConvertedJSON,
    loadToDatabase,
    togglePreview
  }
}

