import { useState, useEffect, startTransition } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useLiveUpdate, useLiveUpdateComplex } from '../useLiveUpdate'
import type { Node, Property } from '../../types'

interface UseNodeEditorProps {
  node: Node | null
}

export function useNodeEditor({ node }: UseNodeEditorProps) {
  const {
    updateNode,
    moveNodeToGroup
  } = useModelBuilderStore()

  const [label, setLabel] = useState('')
  const [type, setType] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [groupId, setGroupId] = useState<string>('')

  useEffect(() => {
    startTransition(() => {
      if (node) {
        setLabel(node.label)
        setType(node.type)
        setProperties(node.properties)
        setGroupId(node.groupId || '')
      } else {
        setLabel('')
        setType('')
        setProperties([])
        setGroupId('')
      }
    })
  }, [node])

  useLiveUpdate(
    label,
    node?.label || '',
    (value) => {
      if (node && value.trim()) {
        updateNode(node.id, { label: value })
      }
    },
    { enabled: !!node && label.trim() !== node.label }
  )

  useLiveUpdate(
    type,
    node?.type || '',
    (value) => {
      if (node && value.trim()) {
        updateNode(node.id, { type: value })
      }
    },
    { enabled: !!node && type.trim() !== node.type }
  )

  useLiveUpdateComplex(
    properties,
    node?.properties || [],
    (value) => {
      if (node) {
        updateNode(node.id, { properties: value })
      }
    },
    { enabled: !!node }
  )

  const handleGroupChange = (value: string) => {
    const newGroupId = value === 'none' ? '' : value
    setGroupId(newGroupId)
    if (node) {
      moveNodeToGroup(node.id, newGroupId === '' ? null : newGroupId)
    }
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

  return {
    label,
    type,
    properties,
    groupId,
    setLabel,
    setType,
    setProperties,
    setGroupId,
    handleGroupChange,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty
  }
}

