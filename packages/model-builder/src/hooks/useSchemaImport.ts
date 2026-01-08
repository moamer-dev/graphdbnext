import { useState } from 'react'
import { ImportService } from '../services/importService'
import { useModelBuilderStore } from '../stores/modelBuilderStore'
import type { ImportResult } from '../services/importService'

export function useSchemaImport () {
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const { clear, loadState } = useModelBuilderStore()

  const importSchema = async (file: File): Promise<ImportResult | null> => {
    setImporting(true)
    setImportError(null)

    try {
      const result = await ImportService.importFromFile(file)
      
      // Clear current state and load imported data
      clear()
      loadState({
        nodes: result.nodes,
        relationships: result.relationships,
        metadata: result.metadata
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import schema'
      setImportError(errorMessage)
      console.error('Import error:', error)
      return null
    } finally {
      setImporting(false)
    }
  }

  return {
    importing,
    importError,
    importSchema,
    clearError: () => setImportError(null)
  }
}

