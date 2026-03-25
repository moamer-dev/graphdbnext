export interface NLQueryRequest {
  query: string
  schema?: {
    nodeLabels: string[]
    relationshipTypes: string[]
    properties: Record<string, string[]>
  }
}

export interface NLQueryResponse {
  cypher: string
  confidence: number
  explanation?: string
  suggestions?: string[]
}

export interface QuerySuggestion {
  query: string
  description: string
  category: string
  confidence: number
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    type: 'outlier' | 'missing' | 'duplicate' | 'inconsistency'
    description: string
    severity: 'low' | 'medium' | 'high'
    data: unknown
  }>
  summary: {
    totalAnomalies: number
    highSeverity: number
    mediumSeverity: number
    lowSeverity: number
  }
}

export class AIService {
  async naturalLanguageToCypher(request: NLQueryRequest): Promise<NLQueryResponse> {
    const { query, schema } = request

    const prompt = this.buildPrompt(query, schema)
    
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, schema })
      })

      if (!response.ok) {
        throw new Error('Failed to convert natural language to Cypher')
      }

      const data = await response.json()
      return {
        cypher: data.cypher || '',
        confidence: data.confidence || 0.5,
        explanation: data.explanation,
        suggestions: data.suggestions
      }
    } catch (error) {
      console.error('Error converting NL to Cypher:', error)
      
      return {
        cypher: this.fallbackConversion(query, schema),
        confidence: 0.3,
        explanation: 'Basic conversion - may need refinement',
        suggestions: []
      }
    }
  }

  async suggestQueries(
    context: string,
    schema?: NLQueryRequest['schema']
  ): Promise<QuerySuggestion[]> {
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, schema })
      })

      if (!response.ok) {
        return this.fallbackSuggestions(context, schema)
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (error) {
      console.error('Error getting query suggestions:', error)
      return this.fallbackSuggestions(context, schema)
    }
  }

  async detectAnomalies(results: unknown[]): Promise<AnomalyDetectionResult> {
    if (!results || results.length === 0) {
      return {
        anomalies: [],
        summary: {
          totalAnomalies: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0
        }
      }
    }

    const anomalies: AnomalyDetectionResult['anomalies'] = []

    const numericFields = this.detectNumericFields(results)
    const duplicates = this.detectDuplicates(results)
    const missingValues = this.detectMissingValues(results)
    const outliers = this.detectOutliers(results, numericFields)

    anomalies.push(...duplicates, ...missingValues, ...outliers)

    const summary = {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter(a => a.severity === 'high').length,
      mediumSeverity: anomalies.filter(a => a.severity === 'medium').length,
      lowSeverity: anomalies.filter(a => a.severity === 'low').length
    }

    return { anomalies, summary }
  }

  private buildPrompt(query: string, schema?: NLQueryRequest['schema']): string {
    let prompt = `Convert the following natural language query to Cypher:\n\n"${query}"\n\n`

    if (schema) {
      prompt += `Available schema:\n`
      prompt += `Node labels: ${schema.nodeLabels.join(', ')}\n`
      prompt += `Relationship types: ${schema.relationshipTypes.join(', ')}\n`
      if (Object.keys(schema.properties).length > 0) {
        prompt += `Properties:\n`
        for (const [label, props] of Object.entries(schema.properties)) {
          prompt += `  ${label}: ${props.join(', ')}\n`
        }
      }
    }

    prompt += `\nReturn only valid Cypher query, no explanations.`

    return prompt
  }

  private fallbackConversion(query: string, schema?: NLQueryRequest['schema']): string {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('find') || lowerQuery.includes('get') || lowerQuery.includes('show')) {
      if (schema && schema.nodeLabels.length > 0) {
        const label = schema.nodeLabels[0]
        return `MATCH (n:${label}) RETURN n LIMIT 10`
      }
      return 'MATCH (n) RETURN n LIMIT 10'
    }

    if (lowerQuery.includes('count')) {
      if (schema && schema.nodeLabels.length > 0) {
        const label = schema.nodeLabels[0]
        return `MATCH (n:${label}) RETURN count(n) as count`
      }
      return 'MATCH (n) RETURN count(n) as count'
    }

    return 'MATCH (n) RETURN n LIMIT 10'
  }

  private fallbackSuggestions(
    context: string,
    schema?: NLQueryRequest['schema']
  ): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = []

    if (schema && schema.nodeLabels.length > 0) {
      schema.nodeLabels.slice(0, 3).forEach(label => {
        suggestions.push({
          query: `MATCH (n:${label}) RETURN n LIMIT 10`,
          description: `Get all ${label} nodes`,
          category: 'exploration',
          confidence: 0.8
        })
      })
    }

    if (schema && schema.relationshipTypes.length > 0) {
      schema.relationshipTypes.slice(0, 2).forEach(type => {
        suggestions.push({
          query: `MATCH (a)-[r:${type}]->(b) RETURN a, r, b LIMIT 10`,
          description: `Find ${type} relationships`,
          category: 'relationships',
          confidence: 0.7
        })
      })
    }

    return suggestions
  }

  private detectNumericFields(results: unknown[]): string[] {
    if (results.length === 0) return []

    const first = results[0]
    if (!first || typeof first !== 'object') return []

    const numericFields: string[] = []
    Object.entries(first as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'number') {
        numericFields.push(key)
      }
    })

    return numericFields
  }

  private detectDuplicates(results: unknown[]): AnomalyDetectionResult['anomalies'] {
    const seen = new Map<string, number>()
    const duplicates: AnomalyDetectionResult['anomalies'] = []

    results.forEach((result, index) => {
      const key = JSON.stringify(result)
      if (seen.has(key)) {
        duplicates.push({
          type: 'duplicate',
          description: `Duplicate result at index ${index} (same as index ${seen.get(key)})`,
          severity: 'medium',
          data: result
        })
      } else {
        seen.set(key, index)
      }
    })

    return duplicates
  }

  private detectMissingValues(results: unknown[]): AnomalyDetectionResult['anomalies'] {
    if (results.length === 0) return []

    const first = results[0]
    if (!first || typeof first !== 'object') return []

    const allKeys = new Set(Object.keys(first as Record<string, unknown>))
    const missing: AnomalyDetectionResult['anomalies'] = []

    results.forEach((result, index) => {
      if (result && typeof result === 'object') {
        const keys = new Set(Object.keys(result as Record<string, unknown>))
        allKeys.forEach(key => {
          if (!keys.has(key)) {
            missing.push({
              type: 'missing',
              description: `Missing property "${key}" at index ${index}`,
              severity: 'low',
              data: { index, key, result }
            })
          }
        })
      }
    })

    return missing
  }

  private detectOutliers(
    results: unknown[],
    numericFields: string[]
  ): AnomalyDetectionResult['anomalies'] {
    if (numericFields.length === 0 || results.length < 3) return []

    const outliers: AnomalyDetectionResult['anomalies'] = []

    numericFields.forEach(field => {
      const values = results
        .map(r => {
          if (r && typeof r === 'object') {
            const val = (r as Record<string, unknown>)[field]
            return typeof val === 'number' ? val : null
          }
          return null
        })
        .filter((v): v is number => v !== null)

      if (values.length < 3) return

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      const threshold = 3 * stdDev

      values.forEach((value, index) => {
        if (Math.abs(value - mean) > threshold) {
          outliers.push({
            type: 'outlier',
            description: `Outlier value ${value} for field "${field}" at index ${index} (mean: ${mean.toFixed(2)}, stdDev: ${stdDev.toFixed(2)})`,
            severity: 'high',
            data: { index, field, value, mean, stdDev }
          })
        }
      })
    })

    return outliers
  }
}

