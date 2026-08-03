'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { resourceHooks } from '@/hooks/react-query'
import { ModelResource, type Model } from '@/resources/ModelResource'
import { toast } from 'sonner'
import type { Schema } from '@/services'
import { normalizeSchema } from '.'

export function useModelDetail() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const modelId = params.id as string

  const [schema, setSchema] = useState<Schema | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  // React Query hooks
  const { data: modelData, isLoading, error, refetch } = resourceHooks.models.useSingle(modelId)
  const deleteModel = resourceHooks.models.useDelete()

  // Extract model data
  const model = modelData?.data as Model | undefined

  // Derive schema from model
  const computedSchema = useMemo(() => {
    if (!model) return null
    if (model.schemaJson) {
      return normalizeSchema(model.schemaJson)
    }
    return null
  }, [model])

  // Handle MD conversion
  useEffect(() => {
    if (!model || computedSchema) return

    if (model.schemaMd) {
      const convertMd = async () => {
        try {
          const convertResponse = await fetch(`/api/models/${modelId}/convert-md`, {
            method: 'POST'
          })
          if (convertResponse.ok) {
            const convertData = await convertResponse.json()
            if (convertData.schema) {
              const normalized = normalizeSchema(convertData.schema)
              setSchema(normalized)
            } else {
              toast.error('Failed to convert Markdown schema to JSON')
            }
          } else {
            toast.error('Failed to convert Markdown schema. Please use JSON format.')
          }
        } catch (error) {
          console.error('Error converting MD schema:', error)
          toast.error('Failed to convert Markdown schema. Please use JSON format.')
        }
      }
      convertMd()
    }
  }, [model, modelId, computedSchema])

  // Navigation on error
  useEffect(() => {
    if (error) {
      router.push(ModelResource.LIST_PATH)
    }
  }, [error, router])

  const handleDelete = async () => {
    try {
      await deleteModel.mutateAsync(modelId)
      setDeleteDialogOpen(false)
      router.push(ModelResource.LIST_PATH)
    } catch (error) {
      console.error('Error deleting model:', error)
    }
  }

  const handleEdit = () => {
    router.push(`${ModelResource.VIEW_PATH}/${modelId}/edit`)
  }

  const handleBack = () => {
    router.push(ModelResource.LIST_PATH)
  }

  return {
    model,
    modelId,
    displaySchema: computedSchema || schema,
    isLoading,
    isAdmin,
    deleteModel,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
    handleEdit,
    handleBack,
    refetch
  }
}
