import type { GraphNode, GraphEdge } from './GraphVisualizationService'

export interface GraphExportOptions {
  format: 'png' | 'svg'
  width?: number
  height?: number
  backgroundColor?: string
  quality?: number
}

export class GraphExportService {
  async exportToPNG(
    svgElement: SVGSVGElement,
    options: GraphExportOptions = { format: 'png', width: 1920, height: 1080 }
  ): Promise<Blob> {
    const { width = 1920, height = 1080, backgroundColor = '#ffffff', quality = 1 } = options

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
        
        const scale = Math.min(width / img.width, height / img.height)
        const x = (width - img.width * scale) / 2
        const y = (height - img.height * scale) / 2
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create PNG blob'))
            }
          },
          'image/png',
          quality
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG image'))
      }
      img.src = url
    })
  }

  exportToSVG(svgElement: SVGSVGElement, options: GraphExportOptions = { format: 'svg' }): string {
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement
    
    if (options.width) {
      svgClone.setAttribute('width', String(options.width))
    }
    if (options.height) {
      svgClone.setAttribute('height', String(options.height))
    }
    if (options.backgroundColor) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', options.backgroundColor)
      svgClone.insertBefore(rect, svgClone.firstChild)
    }

    const serializer = new XMLSerializer()
    return serializer.serializeToString(svgClone)
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  downloadSVG(svgContent: string, filename: string): void {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    this.downloadBlob(blob, filename)
  }
}

