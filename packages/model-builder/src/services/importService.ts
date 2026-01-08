import { convertSchemaJsonToBuilder } from '../utils/schemaConverter'
import { parseMarkdownSchema, convertMarkdownSchemaToBuilder } from '../utils/markdownParser'
import { XmlAnalyzer } from './xmlAnalyzer'
import type { Node, Relationship } from '../types'

export interface ImportResult {
  nodes: Node[]
  relationships: Relationship[]
  metadata: {
    name: string
    description: string
    version: string
  }
  xmlAnalysis?: import('./xmlAnalyzer').XmlStructureAnalysis
  xmlMapping?: import('./xmlAnalyzer').XmlMappingConfig
}

export interface ImportError {
  message: string
  error?: unknown
}

/**
 * Import service for handling schema file imports
 */
export class ImportService {
  /**
   * Import schema from a file
   */
  static async importFromFile (file: File): Promise<ImportResult> {
    const text = await file.text()
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    let nodes: Node[]
    let relationships: Relationship[]
    let metadata = {
      name: 'Imported Schema',
      description: `Imported from ${file.name}`,
      version: '1.0.0'
    }

    if (fileExtension === 'json') {
      // Parse JSON schema
      const schemaJson = JSON.parse(text)

      // Validate schema format
      if (!schemaJson.nodes || !schemaJson.relations) {
        throw new Error('Invalid schema format: missing nodes or relations')
      }

      // Convert schema to builder format
      const converted = convertSchemaJsonToBuilder(schemaJson)
      nodes = converted.nodes
      relationships = converted.relationships

      metadata = {
        name: schemaJson.source || 'Imported Schema',
        description: `Imported from ${file.name}`,
        version: schemaJson.version || '1.0.0'
      }
    } else if (fileExtension === 'md' || fileExtension === 'markdown') {
      // Parse Markdown schema
      const parsedSchema = parseMarkdownSchema(text)

      // Validate that we parsed something
      if (Object.keys(parsedSchema.nodes).length === 0) {
        throw new Error('Invalid Markdown schema format: no nodes found. Make sure the file contains a ## NODES section.')
      }

      // Convert to builder format
      const converted = convertMarkdownSchemaToBuilder(parsedSchema)
      nodes = converted.nodes
      relationships = converted.relationships

      metadata = {
        name: 'Imported Schema',
        description: `Imported from ${file.name}`,
        version: '1.0.0'
      }
    } else if (fileExtension === 'xml') {
      // Analyze XML structure
      const analysis = XmlAnalyzer.analyzeStructure(text)
      
      // Generate default mapping
      const mapping = XmlAnalyzer.generateDefaultMapping(analysis)
      
      // Convert to builder format
      const converted = XmlAnalyzer.convertToBuilderFormat(analysis, mapping)
      nodes = converted.nodes
      relationships = converted.relationships

      metadata = {
        name: analysis.rootElements[0] || 'Imported XML Schema',
        description: `Imported from XML file: ${file.name}. Found ${analysis.elementTypes.length} element types.`,
        version: '1.0.0'
      }

      return {
        nodes,
        relationships,
        metadata,
        xmlAnalysis: analysis,
        xmlMapping: mapping
      }
    } else {
      throw new Error('Unsupported file format. Please use .json, .md, or .xml files.')
    }

    return {
      nodes,
      relationships,
      metadata
    }
  }
}

