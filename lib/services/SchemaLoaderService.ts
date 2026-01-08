import fs from 'fs'
import path from 'path'

export interface SchemaProperty {
  name: string
  datatype: string | null
  values: string[]
  required: boolean
}

export interface SchemaNode {
  name: string
  superclassNames: string[]
  properties: Record<string, SchemaProperty>
  relationsOut: Record<string, string[]> // relation -> target nodes
  relationsIn: Record<string, string[]> // relation -> source nodes
}

export interface SchemaRelation {
  name: string
  properties: Record<string, SchemaProperty>
  domains: Record<string, string[]> // source -> targets[]
}

export interface Schema {
  nodes: Record<string, SchemaNode>
  relations: Record<string, SchemaRelation>
}

/**
 * Schema Loader Service
 * 
 * Provides unified interface for loading schema from application.md or JSON
 */
export class SchemaLoaderService {
  private schema: Schema = { nodes: {}, relations: {} }
  private basePath: string

  constructor (basePath: string) {
    this.basePath = basePath
  }

  async load (): Promise<Schema> {
    // Try new location first (assets/schema relative to graphdbnext)
    // basePath is parent of graphdbnext, so we need graphdbnext/assets/schema
    let applicationPath = path.join(
      this.basePath,
      'graphdbnext',
      'assets',
      'schema',
      'application.md'
    )
    
    // Also try if basePath is already graphdbnext (when called from within graphdbnext)
    if (!fs.existsSync(applicationPath)) {
      applicationPath = path.join(
        this.basePath,
        'assets',
        'schema',
        'application.md'
      )
    }
    
    // Fallback to old location
    if (!fs.existsSync(applicationPath)) {
      applicationPath = path.join(
        this.basePath,
        'EUPT-LPG',
        'EUPT Model',
        'Schema',
        'application.md'
      )
    }

    if (!fs.existsSync(applicationPath)) {
      throw new Error(`application.md not found. Tried:
  - ${path.join(this.basePath, 'graphdbnext', 'assets', 'schema', 'application.md')}
  - ${path.join(this.basePath, 'assets', 'schema', 'application.md')}
  - ${path.join(this.basePath, 'EUPT-LPG', 'EUPT Model', 'Schema', 'application.md')}`)
    }

    const content = fs.readFileSync(applicationPath, 'utf-8')
    console.log(`Loading schema from application.md (${content.length} chars)`)

    // Split into sections
    const nodesSection = this.extractSection(content, '## NODES', '## RELATIONS')
    const relationsSection = this.extractSection(content, '## RELATIONS', '## PROPERTIES REFERENCE')

    // Parse nodes
    this.parseNodes(nodesSection)

    // Parse relations
    this.parseRelations(relationsSection)

    console.log(`Loaded ${Object.keys(this.schema.nodes).length} nodes and ${Object.keys(this.schema.relations).length} relations`)
    return this.schema
  }

  /**
   * Load schema from Markdown content string
   */
  loadFromMarkdown (mdContent: string): Schema {
    // Reset schema
    this.schema = { nodes: {}, relations: {} }

    // Split into sections
    const nodesSection = this.extractSection(mdContent, '## NODES', '## RELATIONS')
    const relationsSection = this.extractSection(mdContent, '## RELATIONS', '## PROPERTIES REFERENCE')

    // Parse nodes
    this.parseNodes(nodesSection)

    // Parse relations
    this.parseRelations(relationsSection)

    console.log(`Loaded ${Object.keys(this.schema.nodes).length} nodes and ${Object.keys(this.schema.relations).length} relations from Markdown`)
    return this.schema
  }

  /**
   * Load schema from JSON file
   */
  async loadFromJSON (jsonPath?: string): Promise<Schema> {
    try {
      // Server-side: read from file system
      const fullPath = jsonPath || path.join(process.cwd(), 'public', 'schema', 'schema.json')
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Schema JSON not found at: ${fullPath}`)
      }
      
      const jsonContent = fs.readFileSync(fullPath, 'utf-8')
      const schemaData = JSON.parse(jsonContent) as { nodes?: Record<string, unknown>; relations?: Record<string, unknown> }
      
      // Convert to Schema format
      this.schema = {
        nodes: (schemaData.nodes || {}) as Record<string, SchemaNode>,
        relations: (schemaData.relations || {}) as Record<string, SchemaRelation>,
      }

      return this.schema
    } catch (error: unknown) {
      console.error('Failed to load schema from JSON:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Schema JSON not found or invalid: ${errorMessage}. Run 'npm run generate-schema' to generate it.`)
    }
  }

  private extractSection (content: string, startMarker: string, endMarker: string): string {
    const startIdx = content.indexOf(startMarker)
    const endIdx = content.indexOf(endMarker)
    
    if (startIdx === -1) {
      return ''
    }
    
    if (endIdx === -1) {
      return content.substring(startIdx)
    }
    
    return content.substring(startIdx, endIdx)
  }

  private parseNodes (nodesSection: string): void {
    // Split by node headings (#### NodeName)
    // Use a more flexible regex that handles multiline content
    const nodeBlocks = nodesSection.split(/#### (\w+)/)
    
    // Skip first element (content before first node)
    for (let i = 1; i < nodeBlocks.length; i += 2) {
      const name = nodeBlocks[i]
      const content = nodeBlocks[i + 1] || ''
      
      // Extract labels - handle multiple labels separated by commas
      // Format: **Labels**: `Thing`, `EditionObject`
      const labelsMatch = content.match(/\*\*Labels\*\*: (.+?)(?:\n|$)/)
      const labelsStr = labelsMatch ? labelsMatch[1] : ''
      
      // Extract properties section
      // Support both "**Properties**:" (application.md) and "**Properties:**" (exported schemas)
      const propertiesMatch = content.match(/(?:\*\*Properties\*\*:|\*\*Properties:\*\*)\s*\n((?:- .+?\n)*)/)
      const propertiesStr = propertiesMatch ? propertiesMatch[1] : ''
      
      // Extract outgoing relations
      const relationsOutMatch = content.match(/\*\*Relations \(outgoing\)\*\*:\s*\n((?:- .+?\n)*)/)
      const relationsOutStr = relationsOutMatch ? relationsOutMatch[1] : ''
      
      // Extract incoming relations
      const relationsInMatch = content.match(/\*\*Relations \(incoming\)\*\*:\s*\n((?:- .+?\n)*)/)
      const relationsInStr = relationsInMatch ? relationsInMatch[1] : ''

      const node: SchemaNode = {
        name,
        superclassNames: this.parseLabels(labelsStr),
        properties: this.parseNodeProperties(propertiesStr),
        relationsOut: this.parseRelationsList(relationsOutStr),
        relationsIn: this.parseRelationsList(relationsInStr),
      }

      this.schema.nodes[name] = node
      console.log(`Loaded node: ${name} with ${node.superclassNames.length} labels, ${Object.keys(node.properties).length} properties`)
    }
  }

  private parseLabels (labelsStr: string): string[] {
    // Extract labels from backticks: `Thing`, `EditionObject`
    // Format: **Labels**: `Thing`, `EditionObject`
    const labels: string[] = []
    const labelRegex = /`(\w+)`/g
    let match
    while ((match = labelRegex.exec(labelsStr)) !== null) {
      labels.push(match[1])
    }
    // All labels are superclasses (the node name itself is not in the labels list)
    // The first label is typically the base class (e.g., "Thing")
    return labels
  }

  private parseNodeProperties (propertiesStr: string): Record<string, SchemaProperty> {
    const properties: Record<string, SchemaProperty> = {}
    
    if (!propertiesStr.trim() || propertiesStr.includes('None')) {
      return properties
    }

    // Match: - `propName` (required/optional, type) - Description - Values: 'val1', 'val2'
    // Format: - `id` (optional, string)
    // Format: - `text` (required, string) - The sign character
    // Format: - `type` (required, string) - Values: 'g' (glyph), 'pc' (punctuation)
    const propRegex = /- `(\w+)` \((required|optional), (\w+)\)(?: - .+?)?(?: - Values: (.+?))?$/gm
    
    let match
    while ((match = propRegex.exec(propertiesStr)) !== null) {
      const propName = match[1]
      const required = match[2] === 'required'
      const datatype = match[3] || null
      const valuesStr = match[4]

      const values: string[] = []
      if (valuesStr) {
        // Extract values from 'value1' (desc1), 'value2' (desc2) or just 'value1', 'value2'
        const valueRegex = /'([^']+)'(?: \([^)]+\))?/g
        let valueMatch
        while ((valueMatch = valueRegex.exec(valuesStr)) !== null) {
          values.push(valueMatch[1])
        }
      }

      properties[propName] = {
        name: propName,
        datatype: this.normalizeDatatype(datatype),
        values,
        required,
      }
    }

    return properties
  }

  private parseRelationsList (relationsStr: string): Record<string, string[]> {
    const relations: Record<string, string[]> = {}
    
    if (!relationsStr.trim() || relationsStr.includes('None')) {
      return relations
    }

    // Match: - `relationName` → Target1, Target2
    // or: - `relationName` ← Source1, Source2
    const relRegex = /- `(\w+)` (→|←) (.+?)$/gm
    
    let match
    while ((match = relRegex.exec(relationsStr)) !== null) {
      const relationName = match[1]
      const targetsStr = match[3]
      
      // Extract target node names (comma-separated)
      const targets = targetsStr.split(',').map(t => t.trim())
      
      if (!relations[relationName]) {
        relations[relationName] = []
      }
      relations[relationName].push(...targets)
    }

    return relations
  }

  private parseRelations (relationsSection: string): void {
    // Split by relation headings (### relationName)
    const relationBlocks = relationsSection.split(/### (\w+)/)
    
    // Skip first element (content before first relation)
    for (let i = 1; i < relationBlocks.length; i += 2) {
      const name = relationBlocks[i]
      const content = relationBlocks[i + 1] || ''
      
      // Extract properties section
      const propertiesMatch = content.match(/\*\*Properties\*\*:\s*\n((?:- .+?\n)*|None)/)
      const propertiesStr = propertiesMatch ? propertiesMatch[1] : ''
      
      // Extract domains section (can be "Domain → Range Examples", "Domain → Range", or "Domain (from)")
      // Support both "**Domain → Range**:" and "**Domain → Range:**" styles
      let domainsStr = ''
      let domainsMatch = content.match(/\*\*Domain(?: → Range)?(?: Examples)?(?: \(from\))?\*\*:\s*\n((?:- .+?\n)*)/)
      if (!domainsMatch) {
        domainsMatch = content.match(/\*\*Domain(?: → Range)?(?: Examples)?(?: \(from\))?:\*\*\s*\n((?:- .+?\n)*)/)
      }
      if (domainsMatch) {
        domainsStr = domainsMatch[1]
      }
      
      // Also check for Range (to) format
      const rangeMatch = content.match(/\*\*Range \(to\)\*\*:\s*\n((?:- .+?\n)*)/)
      const rangeStr = rangeMatch ? rangeMatch[1] : ''

      const relation: SchemaRelation = {
        name,
        properties: this.parseRelationProperties(propertiesStr),
        domains: this.parseRelationDomains(domainsStr, rangeStr),
      }

      this.schema.relations[name] = relation
      
      // If this is "annotates" or "mentions", also add the inverse relation
      if (name === 'annotates') {
        this.schema.relations['annotatedBy'] = {
          name: 'annotatedBy',
          properties: {},
          domains: this.invertDomains(relation.domains),
        }
      }
      if (name === 'mentions') {
        // "mentions" might also have an inverse, but let's check the graph first
        // For now, we'll handle it in the validator if needed
      }
      
      console.log(`Loaded relation: ${name} with ${Object.keys(relation.properties).length} properties, ${Object.keys(relation.domains).length} domains`)
    }
  }

  private parseRelationProperties (propertiesStr: string): Record<string, SchemaProperty> {
    const properties: Record<string, SchemaProperty> = {}
    
    if (!propertiesStr.trim() || propertiesStr.includes('None')) {
      return properties
    }

    // Match: - `propName` (required/optional, type) - Description
    const propRegex = /- `(\w+)` \((required|optional), (\w+)\)(?: - .+?)?$/gm
    
    let match
    while ((match = propRegex.exec(propertiesStr)) !== null) {
      const propName = match[1]
      const required = match[2] === 'required'
      const datatype = match[3] || null

      properties[propName] = {
        name: propName,
        datatype: this.normalizeDatatype(datatype),
        values: [],
        required,
      }
    }

    return properties
  }

  private parseRelationDomains (domainsStr: string, rangeStr?: string): Record<string, string[]> {
    const domains: Record<string, string[]> = {}
    
    // Parse "Domain (from)" format: - Annotation or - `Annotation`
    if (domainsStr.trim()) {
      const domainFromRegex = /- `?(\w+)`?$/gm
      let match
      while ((match = domainFromRegex.exec(domainsStr)) !== null) {
        const source = match[1]
        
        // If we have a range, use it; otherwise leave empty (will be filled by range parsing)
        if (rangeStr) {
          // Parse range: - Thing, Alternative, Alternatives, Annotation, TranslationUnit
          const rangeTargets = rangeStr.split('\n')
            .filter(line => line.trim().startsWith('-'))
            .flatMap(line => {
              // Extract comma-separated targets after the dash
              const targetsMatch = line.match(/-\s*(.+)$/)
              if (targetsMatch) {
                return targetsMatch[1].split(',').map(t => t.trim())
              }
              return []
            })
          
          domains[source] = rangeTargets
        } else {
          // No range specified, leave empty (will be validated as "any")
          domains[source] = []
        }
      }
    }
    
    // Also parse "Domain → Range" format: - SourceNode → Target1, Target2 (with optional backticks)
    if (domainsStr.trim()) {
      const domainRangeRegex = /- `?(\w+)`? → (.+?)$/gm
      let match
      while ((match = domainRangeRegex.exec(domainsStr)) !== null) {
        const source = match[1]
        const targetsStr = match[2]
        
        // Extract target node names (comma-separated)
        const targets = targetsStr.split(',').map(t => t.trim())
        
        domains[source] = targets
      }
    }

    return domains
  }
  
  private invertDomains (domains: Record<string, string[]>): Record<string, string[]> {
    // Invert domains: if annotates has Annotation → [Thing, ...], 
    // then annotatedBy has Thing → [Annotation], etc.
    const inverted: Record<string, string[]> = {}
    
    for (const [source, targets] of Object.entries(domains)) {
      for (const target of targets) {
        if (!inverted[target]) {
          inverted[target] = []
        }
        if (!inverted[target].includes(source)) {
          inverted[target].push(source)
        }
      }
    }
    
    return inverted
  }

  private normalizeDatatype (datatype: string | null): string | null {
    if (!datatype) return null
    
    // Map common datatypes
    const mapping: Record<string, string> = {
      string: 'string',
      integer: 'integer',
      boolean: 'boolean',
      URI: 'URI',
    }
    
    return mapping[datatype.toLowerCase()] || datatype
  }

  getSchema (): Schema {
    return this.schema
  }
}

// Backward compatibility exports
export { SchemaLoaderService as SchemaLoaderFromApplication }
