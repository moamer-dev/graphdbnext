'use client'

import { useState, useCallback, useMemo } from 'react'
import { parsePropertyValue } from '@/lib/utils/propertyUtils'
import { useMutation } from './useMutation'

export interface RelationshipProperty {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean'
}

interface UseRelationshipFormOptions {
  fromNodeId?: number | string
  toNodeId?: number | string
  relationshipType?: string
  onSuccess?: () => void
  onOpenChange?: (open: boolean) => void
}

export function useRelationshipForm ({ 
  fromNodeId, 
  toNodeId, 
  relationshipType,
  onSuccess,
  onOpenChange
}: UseRelationshipFormOptions = {}) {
  const [properties, setProperties] = useState<RelationshipProperty[]>([])
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')
  const [newPropertyType, setNewPropertyType] = useState<'string' | 'number' | 'boolean'>('string')
  
  const { createRelationship, isSaving } = useMutation()

  const handleAddProperty = useCallback(() => {
    if (newPropertyKey.trim()) {
      setProperties(prev => [...prev, { 
        key: newPropertyKey.trim(), 
        value: newPropertyValue, 
        type: newPropertyType 
      }])
      setNewPropertyKey('')
      setNewPropertyValue('')
      setNewPropertyType('string')
    }
  }, [newPropertyKey, newPropertyValue, newPropertyType])

  const handleRemoveProperty = useCallback((index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleCreate = useCallback(async () => {
    if (!fromNodeId || !toNodeId || !relationshipType) {
      return
    }

    const propertiesObj: Record<string, unknown> = {}
    properties.forEach(prop => {
      if (prop.key.trim()) {
        propertiesObj[prop.key] = parsePropertyValue(prop.value, prop.type)
      }
    })

    const result = await createRelationship(fromNodeId, toNodeId, relationshipType, propertiesObj)
    if (result.success) {
      onOpenChange?.(false)
      onSuccess?.()
      return true
    }
    return false
  }, [fromNodeId, toNodeId, relationshipType, properties, createRelationship, onOpenChange, onSuccess])

  const resetForm = useCallback(() => {
    setProperties([])
    setNewPropertyKey('')
    setNewPropertyValue('')
    setNewPropertyType('string')
  }, [])

  return {
    properties,
    setProperties,
    newPropertyKey,
    setNewPropertyKey,
    newPropertyValue,
    setNewPropertyValue,
    newPropertyType,
    setNewPropertyType,
    handleAddProperty,
    handleRemoveProperty,
    handleCreate,
    resetForm,
    isSaving
  }
}
