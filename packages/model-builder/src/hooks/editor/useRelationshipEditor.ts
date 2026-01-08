import { useState, useEffect } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useLiveUpdate, useLiveUpdateComplex } from '../useLiveUpdate'
import type { Relationship, Property } from '../../types'

interface UseRelationshipEditorProps {
  relationship: Relationship | null
}

export function useRelationshipEditor({ relationship }: UseRelationshipEditorProps) {
  const {
    relationships,
    updateRelationship
  } = useModelBuilderStore()

  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cardinality, setCardinality] = useState<'one-to-one' | 'one-to-many' | 'many-to-many' | ''>('')
  const [properties, setProperties] = useState<Property[]>([])
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<Partial<Relationship> | null>(null)
  const [typeRenamed, setTypeRenamed] = useState(false)
  const [typeChangedFromDropdown, setTypeChangedFromDropdown] = useState(false)
  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!relationship) {
        setType('')
        setFrom('')
        setTo('')
        setCardinality('')
        setProperties([])
        setTypeRenamed(false)
        setTypeChangedFromDropdown(false)
        setFromSearch('')
        setToSearch('')
      } else {
        setType(relationship.type)
        setFrom(relationship.from)
        setTo(relationship.to)
        setCardinality(relationship.cardinality || '')
        setProperties(relationship.properties || [])
        setTypeRenamed(false)
        setTypeChangedFromDropdown(false)
        setFromSearch('')
        setToSearch('')
      }
    }, 0)
    
    return () => clearTimeout(timer)
  }, [relationship])

  useLiveUpdate(
    from,
    relationship?.from || '',
    (value) => {
      if (relationship && value) {
        updateRelationship(relationship.id, { from: value })
      }
    },
    { enabled: !!relationship && from !== relationship.from && !!from, delay: 100 }
  )

  useLiveUpdate(
    to,
    relationship?.to || '',
    (value) => {
      if (relationship && value) {
        updateRelationship(relationship.id, { to: value })
      }
    },
    { enabled: !!relationship && to !== relationship.to && !!to, delay: 100 }
  )

  useLiveUpdate(
    cardinality,
    relationship?.cardinality || '',
    (value) => {
      if (relationship) {
        updateRelationship(relationship.id, {
          cardinality: (value || undefined) as 'one-to-one' | 'one-to-many' | 'many-to-many' | undefined
        })
      }
    },
    { enabled: !!relationship && cardinality !== (relationship.cardinality || ''), delay: 100 }
  )

  useLiveUpdateComplex(
    properties,
    relationship?.properties || [],
    (value) => {
      if (relationship) {
        updateRelationship(relationship.id, {
          properties: value.length > 0 ? value : undefined
        })
      }
    },
    { enabled: !!relationship }
  )

  useEffect(() => {
    if (!relationship || !typeChangedFromDropdown || type === relationship.type || !type.trim() || typeRenamed || showBulkUpdateDialog) {
      return
    }
    
    const oldType = relationship.type
    const newType = type.trim()
    
    const relationshipsWithSameType = relationships.filter(
      (rel: Relationship) => rel.type === oldType && rel.id !== relationship.id
    )
    
    if (relationshipsWithSameType.length > 0) {
      setTimeout(() => {
        setPendingUpdate({
          type: newType,
          from: relationship.from,
          to: relationship.to,
          cardinality: relationship.cardinality,
          properties: relationship.properties
        })
        setShowBulkUpdateDialog(true)
      }, 0)
    } else {
      updateRelationship(relationship.id, { type: newType })
      setTimeout(() => {
        setTypeRenamed(true)
        setTypeChangedFromDropdown(false)
      }, 0)
    }
  }, [typeChangedFromDropdown, type, relationship, relationships, typeRenamed, updateRelationship, showBulkUpdateDialog])

  const handleRenameType = () => {
    if (!relationship) return
    
    const oldType = relationship.type
    const newType = type.trim()
    
    if (!newType || newType === oldType) return
    
    const relationshipsWithSameType = relationships.filter(
      (rel: Relationship) => rel.type === oldType && rel.id !== relationship.id
    )
    
    if (relationshipsWithSameType.length > 0) {
      setPendingUpdate({
        type: newType,
        from: relationship.from,
        to: relationship.to,
        cardinality: relationship.cardinality,
        properties: relationship.properties
      })
      setShowBulkUpdateDialog(true)
    } else {
      updateRelationship(relationship.id, { type: newType })
      setTypeRenamed(true)
    }
  }

  const handleBulkUpdate = (updateAll: boolean) => {
    if (!relationship || !pendingUpdate || !pendingUpdate.type) return
    
    const newType = pendingUpdate.type.trim()
    if (!newType) {
      setShowBulkUpdateDialog(false)
      setPendingUpdate(null)
      return
    }
    
    if (updateAll) {
      updateRelationship(relationship.id, { type: newType }, true, relationship.type)
    } else {
      updateRelationship(relationship.id, { type: newType })
    }
    
    setShowBulkUpdateDialog(false)
    setPendingUpdate(null)
    
    requestAnimationFrame(() => {
      setTypeRenamed(false)
      setTypeChangedFromDropdown(false)
    })
  }

  const handleAddProperty = () => {
    setProperties([
      ...properties,
      {
        key: '',
        type: 'string',
        required: false
      }
    ])
  }

  const handleUpdateProperty = (index: number, updates: Partial<Property>) => {
    setProperties(
      properties.map((prop, i) => (i === index ? { ...prop, ...updates } : prop))
    )
  }

  const handleDeleteProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index))
  }

  const handleTypeChange = (value: string) => {
    setType(value)
    setTypeRenamed(false)
    setTypeChangedFromDropdown(true)
  }

  const handleTypeInputChange = (value: string) => {
    setType(value)
    setTypeRenamed(false)
  }

  const handleFromChange = (value: string) => {
    setFrom(value)
    setFromSearch('')
    setFromOpen(false)
  }

  const handleToChange = (value: string) => {
    setTo(value)
    setToSearch('')
    setToOpen(false)
  }

  const handleCardinalityChange = (value: string) => {
    const newCardinality = value === 'none' ? '' : value
    setCardinality(newCardinality as 'one-to-one' | 'one-to-many' | 'many-to-many' | '')
  }

  const handleCloseBulkUpdateDialog = () => {
    setShowBulkUpdateDialog(false)
    setPendingUpdate(null)
    if (relationship) {
      setType(relationship.type)
      setTypeRenamed(false)
      setTypeChangedFromDropdown(false)
    }
  }

  return {
    type,
    from,
    to,
    cardinality,
    properties,
    showBulkUpdateDialog,
    pendingUpdate,
    typeRenamed,
    fromSearch,
    toSearch,
    fromOpen,
    toOpen,
    setType,
    setFrom,
    setTo,
    setCardinality,
    setProperties,
    setFromSearch,
    setToSearch,
    setFromOpen,
    setToOpen,
    setShowBulkUpdateDialog,
    handleRenameType,
    handleBulkUpdate,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty,
    handleTypeChange,
    handleTypeInputChange,
    handleFromChange,
    handleToChange,
    handleCardinalityChange,
    handleCloseBulkUpdateDialog
  }
}

