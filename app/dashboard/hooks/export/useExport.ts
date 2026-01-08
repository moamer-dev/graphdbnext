'use client'

import { useState } from 'react'
import { ExportService } from '@/lib/services/ExportService'
import type { ExportOptions } from '@/lib/services/ExportService'

export function useExport() {
  const [service] = useState(() => new ExportService())
  const [exporting, setExporting] = useState(false)

  const exportToCSV = async (data: unknown[], filename: string, options?: ExportOptions) => {
    setExporting(true)
    try {
      const csv = service.exportToCSV(data, options)
      service.downloadFile(csv, filename, 'text/csv')
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }

  const exportToJSON = async (data: unknown[], filename: string, options?: ExportOptions) => {
    setExporting(true)
    try {
      const json = service.exportToJSON(data, options)
      service.downloadFile(json, filename, 'application/json')
    } catch (error) {
      console.error('Error exporting to JSON:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }

  const exportToGraphML = async (
    nodes: Array<{ id: string; labels: string[]; properties: Record<string, unknown> }>,
    edges: Array<{ id: string; source: string; target: string; type: string; properties: Record<string, unknown> }>,
    filename: string
  ) => {
    setExporting(true)
    try {
      const graphml = service.exportToGraphML(nodes, edges)
      service.downloadFile(graphml, filename, 'application/xml')
    } catch (error) {
      console.error('Error exporting to GraphML:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }

  return {
    exporting,
    exportToCSV,
    exportToJSON,
    exportToGraphML
  }
}

