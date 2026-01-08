'use client'

import { useState } from 'react'
import { GraphExportService } from '@/lib/services/GraphExportService'
import type { GraphExportOptions } from '@/lib/services/GraphExportService'

export function useGraphExport() {
  const [service] = useState(() => new GraphExportService())
  const [exporting, setExporting] = useState(false)

  const exportToPNG = async (
    svgElement: SVGSVGElement,
    filename: string,
    options?: GraphExportOptions
  ) => {
    setExporting(true)
    try {
      const blob = await service.exportToPNG(svgElement, options)
      service.downloadBlob(blob, filename)
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }

  const exportToSVG = async (
    svgElement: SVGSVGElement,
    filename: string,
    options?: GraphExportOptions
  ) => {
    setExporting(true)
    try {
      const svg = service.exportToSVG(svgElement, options)
      service.downloadSVG(svg, filename)
    } catch (error) {
      console.error('Error exporting to SVG:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }

  return {
    exporting,
    exportToPNG,
    exportToSVG
  }
}

