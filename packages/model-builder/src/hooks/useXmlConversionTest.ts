import { useState, useCallback } from 'react'
import { useXmlConverter } from './useXmlConverter'
import { convertXmlMappingToGenericMapping } from '../utils/mappingConfigConverter'
import type { XmlMappingConfig } from '../services/xmlAnalyzer'
import type { SchemaJson, MappingConfig } from '../types/mappingConfig'

/**
 * Hook for testing XML conversion with mapping config and schema
 * Used in the wizard to preview conversion results
 */
export function useXmlConversionTest () {
  const { convert, converting, result, reset } = useXmlConverter()
  const [schemaJson, setSchemaJson] = useState<SchemaJson | null>(null)

  /**
   * Test conversion with XML content, mapping config, and schema
   */
  const testConversion = useCallback(async (
    xmlContent: string,
    xmlMapping: XmlMappingConfig,
    schema: SchemaJson
  ) => {
    // Convert XmlMappingConfig to generic MappingConfig
    const mappingConfig: MappingConfig = convertXmlMappingToGenericMapping(xmlMapping)

    // Perform conversion
    return await convert(xmlContent, schema, mappingConfig)
  }, [convert])

  /**
   * Load schema JSON for validation
   */
  const loadSchema = useCallback((schema: SchemaJson) => {
    setSchemaJson(schema)
  }, [])

  return {
    testConversion,
    loadSchema,
    converting,
    result,
    schemaJson,
    reset
  }
}

