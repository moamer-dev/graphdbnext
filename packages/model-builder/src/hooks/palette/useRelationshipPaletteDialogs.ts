import { useState, useRef } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { parseBulkRelationshipInput } from '../../services/parseService'
import { useBulkRelationshipParser } from '../useBulkParser'

export function useRelationshipPaletteDialogs() {
  const nodes = useModelBuilderStore((state) => state.nodes)
  const selectedRelationship = useModelBuilderStore((state) => state.selectedRelationship)
  const addRelationship = useModelBuilderStore((state) => state.addRelationship)
  const deleteRelationship = useModelBuilderStore((state) => state.deleteRelationship)
  const selectRelationship = useModelBuilderStore((state) => state.selectRelationship)

  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false)
  const [bulkRelationshipDialogOpen, setBulkRelationshipDialogOpen] = useState(false)
  const [relationshipFrom, setRelationshipFrom] = useState<string>('')
  const [relationshipTo, setRelationshipTo] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<string>('')
  const [bulkRelationshipInput, setBulkRelationshipInput] = useState('')
  const [bulkRelationshipFile, setBulkRelationshipFile] = useState<File | null>(null)
  const [deleteRelationshipDialogOpen, setDeleteRelationshipDialogOpen] = useState(false)
  const [pendingRelationshipId, setPendingRelationshipId] = useState<string | null>(null)
  const bulkRelationshipFileInputRef = useRef<HTMLInputElement>(null)

  const { parsedRelationships } = useBulkRelationshipParser(bulkRelationshipInput, nodes)

  const handleAddRelationship = () => {
    if (!relationshipFrom.trim() || !relationshipTo.trim() || !relationshipType.trim()) return

    addRelationship({
      type: relationshipType.trim(),
      from: relationshipFrom.trim(),
      to: relationshipTo.trim(),
      properties: [],
      cardinality: undefined
    })

    setRelationshipFrom('')
    setRelationshipTo('')
    setRelationshipType('')
    setRelationshipDialogOpen(false)
  }

  const handleBulkRelationshipAdd = () => {
    if (bulkRelationshipFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileContent = e.target?.result as string
        const relationshipsToAdd = parseBulkRelationshipInput(fileContent, nodes)
        
        relationshipsToAdd.forEach((rel) => {
          addRelationship({
            type: rel.type,
            from: rel.from,
            to: rel.to,
            properties: [],
            cardinality: undefined
          })
        })
        
        setBulkRelationshipInput('')
        setBulkRelationshipFile(null)
        setBulkRelationshipDialogOpen(false)
        if (bulkRelationshipFileInputRef.current) {
          bulkRelationshipFileInputRef.current.value = ''
        }
      }
      reader.readAsText(bulkRelationshipFile)
      return
    }
    
    parsedRelationships.forEach((rel) => {
      addRelationship({
        type: rel.type,
        from: rel.from,
        to: rel.to,
        properties: [],
        cardinality: undefined
      })
    })
    
    setBulkRelationshipInput('')
    setBulkRelationshipDialogOpen(false)
  }

  const handleBulkRelationshipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBulkRelationshipFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setBulkRelationshipInput(content)
      }
      reader.readAsText(file)
    }
  }

  const handleDeleteRelationship = (relationshipId: string) => {
    setPendingRelationshipId(relationshipId)
    setDeleteRelationshipDialogOpen(true)
  }

  const handleConfirmDeleteRelationship = () => {
    if (pendingRelationshipId) {
      deleteRelationship(pendingRelationshipId)
      if (selectedRelationship === pendingRelationshipId) {
        selectRelationship(null)
      }
      setPendingRelationshipId(null)
      setDeleteRelationshipDialogOpen(false)
    }
  }

  return {
    relationshipDialogOpen,
    setRelationshipDialogOpen,
    bulkRelationshipDialogOpen,
    setBulkRelationshipDialogOpen,
    deleteRelationshipDialogOpen,
    setDeleteRelationshipDialogOpen,
    relationshipFrom,
    setRelationshipFrom,
    relationshipTo,
    setRelationshipTo,
    relationshipType,
    setRelationshipType,
    bulkRelationshipInput,
    setBulkRelationshipInput,
    bulkRelationshipFile,
    setBulkRelationshipFile,
    pendingRelationshipId,
    bulkRelationshipFileInputRef,
    parsedRelationships,
    handleAddRelationship,
    handleBulkRelationshipAdd,
    handleBulkRelationshipFileSelect,
    handleDeleteRelationship,
    handleConfirmDeleteRelationship
  }
}

