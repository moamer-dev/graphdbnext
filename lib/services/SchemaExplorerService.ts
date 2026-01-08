import { getGraphDatabaseService } from './graph-database'

export interface SchemaNode {
  label: string
  count: number
  properties: SchemaProperty[]
  relationships: SchemaRelationship[]
}

export interface SchemaProperty {
  key: string
  type: string
  nullable: boolean
  sampleValues: unknown[]
  distribution?: PropertyDistribution
}

export interface PropertyDistribution {
  unique: number
  nullCount: number
  valueCounts: Record<string, number>
}

export interface SchemaRelationship {
  type: string
  direction: 'outgoing' | 'incoming' | 'both'
  count: number
  targetLabels: string[]
}

export interface SchemaStatistics {
  totalNodes: number
  totalRelationships: number
  nodeLabels: SchemaNode[]
  relationshipTypes: Array<{
    type: string
    count: number
    fromLabels: string[]
    toLabels: string[]
  }>
  propertyTypes: Record<string, string[]>
}

export class SchemaExplorerService {
  private db = getGraphDatabaseService()

  private escapeIdentifier(identifier: string): string {
    if (/[^a-zA-Z0-9_]/.test(identifier)) {
      return `\`${identifier.replace(/`/g, '``')}\``
    }
    return identifier
  }

  async getSchemaStatistics(): Promise<SchemaStatistics> {
    await this.db.connect()

    const nodeLabelsQuery = `
      MATCH (n)
      UNWIND labels(n) as label
      WITH label, count(n) as count
      RETURN label, count
      ORDER BY count DESC
    `

    const relationshipTypesQuery = `
      MATCH (a)-[r]->(b)
      WITH type(r) as relType, labels(a) as fromLabels, labels(b) as toLabels, count(r) as count
      RETURN relType, fromLabels, toLabels, count
      ORDER BY count DESC
    `

    const totalNodesQuery = `MATCH (n) RETURN count(n) as total`
    const totalRelationshipsQuery = `MATCH ()-[r]->() RETURN count(r) as total`

    const [nodeLabelsResult, relationshipTypesResult, totalNodesResult, totalRelationshipsResult] = await Promise.all([
      this.db.execute(nodeLabelsQuery),
      this.db.execute(relationshipTypesQuery),
      this.db.execute(totalNodesQuery),
      this.db.execute(totalRelationshipsQuery)
    ])

    const totalNodes = ((totalNodesResult[0] as Record<string, unknown>)?.total as number) || 0
    const totalRelationships = ((totalRelationshipsResult[0] as Record<string, unknown>)?.total as number) || 0

    const nodeLabels: SchemaNode[] = []
    for (const row of nodeLabelsResult) {
      const rowData = row as Record<string, unknown>
      const label = rowData.label as string
      const count = rowData.count as number
      
      const properties = await this.getPropertiesForLabel(label)
      const relationships = await this.getRelationshipsForLabel(label)
      
      nodeLabels.push({
        label,
        count,
        properties,
        relationships
      })
    }

    const relationshipTypes = relationshipTypesResult.map((row: unknown) => {
      const rowData = row as Record<string, unknown>
      return {
        type: rowData.relType as string,
        count: rowData.count as number,
        fromLabels: rowData.fromLabels as string[],
        toLabels: rowData.toLabels as string[]
      }
    })

    const propertyTypes: Record<string, string[]> = {}
    for (const node of nodeLabels) {
      for (const prop of node.properties) {
        if (!propertyTypes[prop.type]) {
          propertyTypes[prop.type] = []
        }
        if (!propertyTypes[prop.type].includes(prop.key)) {
          propertyTypes[prop.type].push(prop.key)
        }
      }
    }

    return {
      totalNodes,
      totalRelationships,
      nodeLabels,
      relationshipTypes,
      propertyTypes
    }
  }

  private async getPropertiesForLabel(label: string): Promise<SchemaProperty[]> {
    const escapedLabel = this.escapeIdentifier(label)
    const query = `
      MATCH (n:${escapedLabel})
      WITH n LIMIT 1000
      UNWIND keys(n) as key
      WITH key, collect(DISTINCT n[key]) as values
      RETURN key, values
      ORDER BY key
    `

    const results = await this.db.execute(query)
    const properties: SchemaProperty[] = []

    for (const row of results) {
      const rowData = row as Record<string, unknown>
      const key = rowData.key as string
      const values = (rowData.values as unknown[]) || []
      
      const nonNullValues = values.filter(v => v !== null && v !== undefined)
      const nullable = values.length !== nonNullValues.length
      
      const types = new Set<string>()
      nonNullValues.forEach(v => {
        if (Array.isArray(v)) {
          types.add('array')
        } else if (typeof v === 'object' && v !== null) {
          types.add('object')
        } else {
          types.add(typeof v)
        }
      })
      
      const type = types.size === 1 ? Array.from(types)[0] : 'mixed'
      
      const sampleValues = nonNullValues.slice(0, 5)
      
      const distribution = await this.getPropertyDistribution(label, key)
      
      properties.push({
        key,
        type,
        nullable,
        sampleValues,
        distribution
      })
    }

    return properties
  }

  private async getPropertyDistribution(label: string, propertyKey: string): Promise<PropertyDistribution> {
    const escapedLabel = this.escapeIdentifier(label)
    const escapedProperty = this.escapeIdentifier(propertyKey)
    const query = `
      MATCH (n:${escapedLabel})
      WHERE n.${escapedProperty} IS NOT NULL
      WITH n.${escapedProperty} as value, count(*) as count
      RETURN value, count
      ORDER BY count DESC
      LIMIT 20
    `

    try {
      const results = await this.db.execute(query)
      const valueCounts: Record<string, number> = {}
      
      results.forEach((row: unknown) => {
        const rowData = row as { value: unknown; count: number }
        const value = String(rowData.value)
        valueCounts[value] = rowData.count
      })

      const uniqueQuery = `
        MATCH (n:${escapedLabel})
        WHERE n.${escapedProperty} IS NOT NULL
        RETURN count(DISTINCT n.${escapedProperty}) as unique
      `
      const uniqueResult = await this.db.execute(uniqueQuery)
      const unique = ((uniqueResult[0] as Record<string, unknown>)?.unique as number) || 0

      const nullQuery = `
        MATCH (n:${escapedLabel})
        WHERE n.${escapedProperty} IS NULL
        RETURN count(n) as nullCount
      `
      const nullResult = await this.db.execute(nullQuery)
      const nullCount = ((nullResult[0] as Record<string, unknown>)?.nullCount as number) || 0

      return {
        unique,
        nullCount,
        valueCounts
      }
    } catch (error) {
      console.error('Error getting property distribution:', error)
      return {
        unique: 0,
        nullCount: 0,
        valueCounts: {}
      }
    }
  }

  private async getRelationshipsForLabel(label: string): Promise<SchemaRelationship[]> {
    const escapedLabel = this.escapeIdentifier(label)
    const outgoingQuery = `
      MATCH (a:${escapedLabel})-[r]->(b)
      WITH type(r) as relType, labels(b) as targetLabels, count(r) as count
      RETURN relType, targetLabels, count
      ORDER BY count DESC
    `

    const incomingQuery = `
      MATCH (a)<-[r]-(b:${escapedLabel})
      WITH type(r) as relType, labels(b) as sourceLabels, count(r) as count
      RETURN relType, sourceLabels, count
      ORDER BY count DESC
    `

    const [outgoing, incoming] = await Promise.all([
      this.db.execute(outgoingQuery),
      this.db.execute(incomingQuery)
    ])

    const relMap = new Map<string, SchemaRelationship>()

    outgoing.forEach((row: unknown) => {
      const rowData = row as { relType: string; targetLabels: string[]; count: number }
      const key = `outgoing:${rowData.relType}`
      relMap.set(key, {
        type: rowData.relType,
        direction: 'outgoing',
        count: rowData.count,
        targetLabels: rowData.targetLabels
      })
    })

    incoming.forEach((row: unknown) => {
      const rowData = row as { relType: string; sourceLabels: string[]; count: number }
      const key = `incoming:${rowData.relType}`
      const existing = relMap.get(key)
      if (existing) {
        existing.direction = 'both'
        existing.count += rowData.count
      } else {
        relMap.set(key, {
          type: rowData.relType,
          direction: 'incoming',
          count: rowData.count,
          targetLabels: rowData.sourceLabels
        })
      }
    })

    return Array.from(relMap.values())
  }

  async validateSchema(requiredLabels: string[], requiredProperties: Record<string, string[]>): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    const stats = await this.getSchemaStatistics()
    const existingLabels = new Set(stats.nodeLabels.map(n => n.label))

    for (const label of requiredLabels) {
      if (!existingLabels.has(label)) {
        errors.push(`Required label "${label}" not found in database`)
      }
    }

    for (const [label, properties] of Object.entries(requiredProperties)) {
      if (!existingLabels.has(label)) {
        continue
      }

      const node = stats.nodeLabels.find(n => n.label === label)
      if (node) {
        const existingProps = new Set(node.properties.map(p => p.key))
        for (const prop of properties) {
          if (!existingProps.has(prop)) {
            warnings.push(`Property "${prop}" not found on label "${label}"`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

