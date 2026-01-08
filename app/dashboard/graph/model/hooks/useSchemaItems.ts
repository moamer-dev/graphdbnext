import { useMemo } from 'react'
import type { Schema } from '@/lib/services/SchemaLoaderService'
import { ViewType } from './useUrlSync'

export function useSchemaItems (schema: Schema | null, selectedType: ViewType, searchTerm: string) {
  const items = useMemo(() => {
    if (!schema) return {}
    return selectedType === 'nodes' ? schema.nodes : schema.relations
  }, [schema, selectedType])

  const filteredItems = useMemo(() => {
    return Object.entries(items).filter(([name]) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [items, searchTerm])

  return { items, filteredItems }
}

