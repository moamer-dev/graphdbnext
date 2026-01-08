/**
 * API Route: Get Property Keys from Graph JSON
 * GET /api/properties - Returns property keys grouped by node labels
 */

import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const OUTPUT_DIR = join(process.cwd(), 'output')
const JSON_FILE = 'KTU_1.14_full.json'

export async function GET () {
  try {
    const filePath = join(OUTPUT_DIR, JSON_FILE)
    
    // Read and parse the JSON file
    const fileContent = await readFile(filePath, 'utf-8')
    const graph = JSON.parse(fileContent)

    // Extract properties grouped by node labels
    // Map: label -> Set of property keys
    const propertiesByLabel = new Map<string, Set<string>>()
    const allProperties = new Set<string>()
    
    if (Array.isArray(graph)) {
      graph.forEach((item: unknown) => {
        if (item && typeof item === 'object' && 'type' in item) {
          const node = item as { type: string, labels?: string[], properties?: Record<string, unknown> }
          
          // Only process nodes (not relationships)
          if (node.type === 'node' && node.labels && node.properties && typeof node.properties === 'object') {
            const props = node.properties as Record<string, unknown>
            // For each label, add the properties
            node.labels.forEach(label => {
              if (!propertiesByLabel.has(label)) {
                propertiesByLabel.set(label, new Set<string>())
              }
              
              const labelProps = propertiesByLabel.get(label)!
              Object.keys(props).forEach(key => {
                labelProps.add(key)
                allProperties.add(key)
              })
            })
          }
        }
      })
    }

    // Convert Map to object with sorted arrays
    const propertiesByLabelObj: Record<string, string[]> = {}
    propertiesByLabel.forEach((props, label) => {
      propertiesByLabelObj[label] = Array.from(props).sort()
    })

    const sortedAllProperties = Array.from(allProperties).sort()

    return NextResponse.json({
      success: true,
      properties: sortedAllProperties, // All properties for backward compatibility
      propertiesByLabel: propertiesByLabelObj, // Properties grouped by label
      count: sortedAllProperties.length
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract property keys'
    console.error('Property keys extraction error:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

