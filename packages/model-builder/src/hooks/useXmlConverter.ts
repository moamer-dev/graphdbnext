import { useState, useCallback } from 'react'
import { convertXmlToGraph } from '../services/xmlConverter'
import type { MappingConfig, SchemaJson, ConversionResult } from '../types/mappingConfig'

/**
 * Hook for converting XML to graph using mapping config and schema
 */
export function useXmlConverter () {
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)

  const convert = useCallback(async (
    xmlContent: string,
    schemaJson: SchemaJson,
    mappingConfig: MappingConfig
  ): Promise<ConversionResult> => {
    setConverting(true)
    try {
      const conversionResult = convertXmlToGraph(xmlContent, schemaJson, mappingConfig)
      setResult(conversionResult)
      return conversionResult
    } catch (error) {
      const errorResult: ConversionResult = {
        nodes: [],
        relationships: [],
        errors: [{
          type: 'xml',
          message: error instanceof Error ? error.message : 'Unknown error during conversion'
        }],
        warnings: []
      }
      setResult(errorResult)
      return errorResult
    } finally {
      setConverting(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return {
    convert,
    converting,
    result,
    reset
  }
}

