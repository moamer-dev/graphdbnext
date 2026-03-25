import { getGraphDatabaseService } from './graph-database'

export interface NodeDistribution {
  label: string
  count: number
  percentage: number
}

export interface RelationshipDistribution {
  type: string
  count: number
  percentage: number
}

export interface PropertyDistribution {
  property: string
  label: string
  uniqueValues: number
  nullCount: number
  valueCounts: Record<string, number>
}

export interface DegreeCentrality {
  nodeId: string
  labels: string[]
  inDegree: number
  outDegree: number
  totalDegree: number
}

export interface AnalyticsData {
  nodeDistribution: NodeDistribution[]
  relationshipDistribution: RelationshipDistribution[]
  propertyDistributions: PropertyDistribution[]
  degreeCentrality: DegreeCentrality[]
  growthTrends?: GrowthTrend[]
}

export interface GrowthTrend {
  date: string
  nodes: number
  relationships: number
}

export class GraphAnalyticsService {
  private db = getGraphDatabaseService()

  private escapeIdentifier(identifier: string): string {
    if (/[^a-zA-Z0-9_]/.test(identifier)) {
      return `\`${identifier.replace(/`/g, '``')}\``
    }
    return identifier
  }

  async getNodeDistribution(): Promise<NodeDistribution[]> {
    await this.db.connect()
    
    const totalQuery = `MATCH (n) RETURN count(n) as total`
    const totalResult = await this.db.execute(totalQuery)
    const total = ((totalResult[0] as Record<string, unknown>)?.total as number) || 1
    
    const query = `
      MATCH (n)
      UNWIND labels(n) as label
      WITH label, count(n) as count
      RETURN label, count
      ORDER BY count DESC
    `

    const results = await this.db.execute(query)
    return results.map((row: unknown) => {
      const rowData = row as { label: string; count: number }
      return {
        label: rowData.label,
        count: rowData.count,
        percentage: (rowData.count * 100.0) / total
      }
    })
  }

  async getRelationshipDistribution(): Promise<RelationshipDistribution[]> {
    await this.db.connect()
    
    const totalQuery = `MATCH ()-[r]->() RETURN count(r) as total`
    const totalResult = await this.db.execute(totalQuery)
    const total = ((totalResult[0] as Record<string, unknown>)?.total as number) || 1
    
    const query = `
      MATCH ()-[r]->()
      WITH type(r) as type, count(r) as count
      RETURN type, count
      ORDER BY count DESC
    `

    const results = await this.db.execute(query)
    return results.map((row: unknown) => {
      const rowData = row as { type: string; count: number }
      return {
        type: rowData.type,
        count: rowData.count,
        percentage: (rowData.count * 100.0) / total
      }
    })
  }

  async getPropertyValueDistribution(label: string, property: string): Promise<PropertyDistribution> {
    await this.db.connect()
    
    const escapedLabel = this.escapeIdentifier(label)
    const escapedProperty = this.escapeIdentifier(property)
    const query = `
      MATCH (n:${escapedLabel})
      WHERE n.${escapedProperty} IS NOT NULL
      WITH n.${escapedProperty} as value, count(*) as count
      RETURN value, count
      ORDER BY count DESC
      LIMIT 50
    `

    const results = await this.db.execute(query)
    const valueCounts: Record<string, number> = {}
    
    results.forEach((row: unknown) => {
      const rowData = row as { value: unknown; count: number }
      valueCounts[String(rowData.value)] = rowData.count
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
      property,
      label,
      uniqueValues: unique,
      nullCount,
      valueCounts
    }
  }

  async getDegreeCentrality(limit: number = 100): Promise<DegreeCentrality[]> {
    await this.db.connect()
    
    const limitInt = Math.floor(Math.max(1, limit))
    const query = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r_out]->()
      OPTIONAL MATCH ()-[r_in]->(n)
      WITH n, 
           count(DISTINCT r_out) as outDegree,
           count(DISTINCT r_in) as inDegree
      RETURN id(n) as nodeId, labels(n) as labels, inDegree, outDegree, (inDegree + outDegree) as totalDegree
      ORDER BY totalDegree DESC
      LIMIT ${limitInt}
    `

    const results = await this.db.execute(query)
    return results.map((row: unknown) => {
      const rowData = row as { nodeId: number; labels: string[]; inDegree: number; outDegree: number; totalDegree: number }
      return {
        nodeId: String(rowData.nodeId),
        labels: rowData.labels,
        inDegree: rowData.inDegree,
        outDegree: rowData.outDegree,
        totalDegree: rowData.totalDegree
      }
    })
  }

  async getGrowthTrends(days: number = 30): Promise<GrowthTrend[]> {
    await this.db.connect()
    
    const limitInt = Math.floor(Math.max(1, days))
    const query = `
      MATCH (n)
      WHERE n.createdAt IS NOT NULL
      WITH date(n.createdAt) as date, count(n) as nodes
      RETURN date, nodes
      ORDER BY date
      LIMIT ${limitInt}
    `

    const results = await this.db.execute(query)
    const trends: GrowthTrend[] = []

    for (const row of results) {
      const rowData = row as Record<string, unknown>
      const date = rowData.date as string
      const nodes = rowData.nodes as number
      
      const relQuery = `
        MATCH ()-[r]->()
        WHERE r.createdAt IS NOT NULL AND date(r.createdAt) = date($date)
        RETURN count(r) as relationships
      `
      const relResult = await this.db.execute(relQuery, { date })
      const relationships = ((relResult[0] as Record<string, unknown>)?.relationships as number) || 0

      trends.push({
        date,
        nodes,
        relationships
      })
    }

    return trends
  }

  async getFullAnalytics(): Promise<AnalyticsData> {
    const [nodeDistribution, relationshipDistribution, degreeCentrality] = await Promise.all([
      this.getNodeDistribution(),
      this.getRelationshipDistribution(),
      this.getDegreeCentrality()
    ])

    const propertyDistributions: PropertyDistribution[] = []
    const labels = new Set<string>()
    nodeDistribution.forEach(nd => labels.add(nd.label))

    for (const label of Array.from(labels).slice(0, 10)) {
      const escapedLabel = this.escapeIdentifier(label)
      const propsQuery = `
        MATCH (n:${escapedLabel})
        WITH n LIMIT 100
        UNWIND keys(n) as key
        RETURN DISTINCT key
        LIMIT 5
      `
      const propsResult = await this.db.execute(propsQuery)
      
      for (const propRow of propsResult.slice(0, 3)) {
        const propRowData = propRow as Record<string, unknown>
        const prop = propRowData.key as string
        const dist = await this.getPropertyValueDistribution(label, prop)
        propertyDistributions.push(dist)
      }
    }

    return {
      nodeDistribution,
      relationshipDistribution,
      propertyDistributions,
      degreeCentrality
    }
  }

  private async connect(): Promise<void> {
    await this.db.connect()
  }
}

