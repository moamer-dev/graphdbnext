export interface SavedQuery {
  id: string
  name: string
  description?: string
  query: string
  category?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  executedAt?: string
  executionCount?: number
  source?: 'builder' | 'cypher' | 'library' // Where the query came from
}

const STORAGE_KEY = 'graphdb_saved_queries'
const HISTORY_KEY = 'graphdb_query_history'
const MAX_HISTORY = 50

export function getSavedQueries(): SavedQuery[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading saved queries:', error)
    return []
  }
}

export function saveQuery(query: SavedQuery): void {
  if (typeof window === 'undefined') return
  
  try {
    const queries = getSavedQueries()
    const existingIndex = queries.findIndex(q => q.id === query.id)
    
    if (existingIndex >= 0) {
      // Update existing query
      queries[existingIndex] = {
        ...query,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Add new query
      queries.push({
        ...query,
        createdAt: query.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries))
  } catch (error) {
    console.error('Error saving query:', error)
  }
}

export function deleteQuery(queryId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const queries = getSavedQueries().filter(q => q.id !== queryId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries))
  } catch (error) {
    console.error('Error deleting query:', error)
  }
}

export function getQueryById(queryId: string): SavedQuery | undefined {
  return getSavedQueries().find(q => q.id === queryId)
}

export function getQueriesByCategory(category: string): SavedQuery[] {
  return getSavedQueries().filter(q => q.category === category)
}

// Query History
export interface QueryHistoryItem {
  id: string
  query: string
  executedAt: string
  resultCount?: number
  executionTime?: number
}

export function getQueryHistory(): QueryHistoryItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading query history:', error)
    return []
  }
}

export function addToHistory(query: string, resultCount?: number, executionTime?: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const history = getQueryHistory()
    const newItem: QueryHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: query.trim(),
      executedAt: new Date().toISOString(),
      resultCount,
      executionTime
    }
    
    // Remove duplicates (same query)
    const filtered = history.filter(item => item.query !== newItem.query)
    
    // Add to beginning and limit size
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY)
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    
    // Also update the saved query's execution info if it exists
    const savedQueries = getSavedQueries()
    const matchingSaved = savedQueries.find(q => q.query.trim() === query.trim())
    if (matchingSaved) {
      matchingSaved.executedAt = newItem.executedAt
      matchingSaved.executionCount = (matchingSaved.executionCount || 0) + 1
      saveQuery(matchingSaved)
    }
  } catch (error) {
    console.error('Error adding to query history:', error)
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('Error clearing query history:', error)
  }
}

export function exportQueries(): string {
  const queries = getSavedQueries()
  return JSON.stringify(queries, null, 2)
}

export function importQueries(jsonString: string): { success: number, errors: number } {
  if (typeof window === 'undefined') return { success: 0, errors: 0 }
  
  try {
    const imported = JSON.parse(jsonString) as SavedQuery[]
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format')
    }
    
    const existing = getSavedQueries()
    const existingIds = new Set(existing.map(q => q.id))
    
    let success = 0
    let errors = 0
    
    imported.forEach(query => {
      try {
        // Generate new ID if it already exists
        if (existingIds.has(query.id)) {
          query.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        
        // Ensure required fields
        if (!query.name || !query.query) {
          errors++
          return
        }
        
        saveQuery(query)
        success++
      } catch (error) {
        errors++
      }
    })
    
    return { success, errors }
  } catch (error) {
    console.error('Error importing queries:', error)
    return { success: 0, errors: 1 }
  }
}

