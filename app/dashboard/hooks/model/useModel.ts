import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Schema } from '@/lib/services/SchemaLoaderService'
import { useLoading } from '../util/useLoading'

export function useModel () {
  const { loading: schemaGenerating, withLoading: withSchemaGenerating } = useLoading()
  const [schema, setSchema] = useState<Schema | null>(null)
  const [schemaGenerationResult, setSchemaGenerationResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  useEffect(() => {
    fetch('/schema/schema.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load schema: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        setSchema({
          nodes: data.nodes || {},
          relations: data.relations || {}
        })
      })
      .catch(err => {
        console.error('Failed to load schema:', err)
        console.error('Run "npm run generate-schema" or use the "Generate Schema" button to generate the schema JSON file')
      })
  }, [])

  const generateSchema = async () => {
    await withSchemaGenerating(async () => {
      setSchemaGenerationResult(null)

      try {
        const response = await fetch('/api/schema/generate', {
          method: 'POST'
        })

        const data = await response.json()

        if (data.success) {
          setSchemaGenerationResult({
            success: true,
            message: data.message || 'Schema generated successfully'
          })
          toast.success('Schema generated successfully! Reloading schema...')

          setTimeout(() => {
            fetch('/schema/schema.json')
              .then(res => {
                if (!res.ok) throw new Error('Failed to reload schema')
                return res.json()
              })
              .then(data => {
                setSchema({
                  nodes: data.nodes || {},
                  relations: data.relations || {}
                })
                toast.success('Schema loaded successfully!')
              })
              .catch(err => {
                console.error('Failed to reload schema:', err)
                toast.error('Schema generated but failed to reload. Please refresh the page.')
              })
          }, 1000)
        } else {
          setSchemaGenerationResult({
            success: false,
            error: data.error || 'Failed to generate schema'
          })
          toast.error(data.error || 'Failed to generate schema')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate schema'
        setSchemaGenerationResult({
          success: false,
          error: errorMessage
        })
        toast.error(errorMessage)
      }
    })
  }

  return {
    schema,
    schemaGenerating,
    schemaGenerationResult,
    generateSchema
  }
}

