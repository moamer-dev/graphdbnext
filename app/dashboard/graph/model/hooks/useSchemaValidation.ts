import { useEffect, startTransition } from 'react'
import type { Schema } from '@/lib/services/SchemaLoaderService'
import { ViewType } from './useUrlSync'

export function useSchemaValidation (
  schema: Schema | null,
  selectedType: ViewType,
  selectedItem: string | null,
  setSelectedItem: (item: string | null) => void
) {
  useEffect(() => {
    if (!schema || !selectedItem) return

    const currentItems = selectedType === 'nodes' ? schema.nodes : schema.relations
    if (!currentItems[selectedItem]) {
      startTransition(() => {
        setSelectedItem(null)
      })
    }
  }, [selectedType, schema, selectedItem, setSelectedItem])
}

