import type { GraphNode, GraphEdge } from './GraphVisualizationService'

export interface ExportOptions {
  includeHeaders?: boolean
  delimiter?: string
  format?: 'csv' | 'json' | 'graphml'
}

export class ExportService {
  exportToCSV(data: unknown[], options: ExportOptions = {}): string {
    const { includeHeaders = true, delimiter = ',' } = options

    if (!data || data.length === 0) {
      return ''
    }

    const allKeys = new Set<string>()
    data.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => allKeys.add(key))
      }
    })

    const keys = Array.from(allKeys)
    const rows: string[] = []

    if (includeHeaders) {
      rows.push(keys.map(key => this.escapeCSVValue(key)).join(delimiter))
    }

    data.forEach(row => {
      const values = keys.map(key => {
        const value = row && typeof row === 'object' ? (row as Record<string, unknown>)[key] : null
        return this.escapeCSVValue(this.serializeValue(value))
      })
      rows.push(values.join(delimiter))
    })

    return rows.join('\n')
  }

  exportToJSON(data: unknown[], options: ExportOptions = {}): string {
    return JSON.stringify(data, null, 2)
  }

  exportToGraphML(nodes: GraphNode[], edges: GraphEdge[]): string {
    const nodeIds = new Set(nodes.map(n => n.id))
    const edgeIds = new Set(edges.map(e => e.id))

    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n'
    graphml += '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
    graphml += '  xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns\n'
    graphml += '  http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n'

    graphml += '  <key id="label" for="node" attr.name="label" attr.type="string"/>\n'
    graphml += '  <key id="type" for="edge" attr.name="type" attr.type="string"/>\n'

    graphml += '  <graph id="G" edgedefault="directed">\n'

    nodes.forEach(node => {
      graphml += `    <node id="${this.escapeXML(node.id)}">\n`
      graphml += `      <data key="label">${this.escapeXML(node.labels.join(', '))}</data>\n`
      
      if (node.properties) {
        Object.entries(node.properties).forEach(([key, value]) => {
          if (!graphml.includes(`id="${key}"`)) {
            graphml += `  <key id="${this.escapeXML(key)}" for="node" attr.name="${this.escapeXML(key)}" attr.type="string"/>\n`
          }
          graphml += `      <data key="${this.escapeXML(key)}">${this.escapeXML(String(value))}</data>\n`
        })
      }
      
      graphml += '    </node>\n'
    })

    edges.forEach(edge => {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        graphml += `    <edge id="${this.escapeXML(edge.id)}" source="${this.escapeXML(edge.source)}" target="${this.escapeXML(edge.target)}">\n`
        graphml += `      <data key="type">${this.escapeXML(edge.type)}</data>\n`
        
        if (edge.properties) {
          Object.entries(edge.properties).forEach(([key, value]) => {
            if (!graphml.includes(`id="${key}"`)) {
              graphml += `  <key id="${this.escapeXML(key)}" for="edge" attr.name="${this.escapeXML(key)}" attr.type="string"/>\n`
            }
            graphml += `      <data key="${this.escapeXML(key)}">${this.escapeXML(String(value))}</data>\n`
          })
        }
        
        graphml += '    </edge>\n'
      }
    })

    graphml += '  </graph>\n'
    graphml += '</graphml>'

    return graphml
  }

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private serializeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  private escapeXML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

