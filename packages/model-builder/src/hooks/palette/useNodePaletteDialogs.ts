import { useState, useRef } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { parseBulkNodeInput } from '../../services/parseService'
import { useBulkNodeParser } from '../useBulkParser'

export function useNodePaletteDialogs() {
  const nodes = useModelBuilderStore((state) => state.nodes)
  const groups = useModelBuilderStore((state) => state.groups)
  const addNode = useModelBuilderStore((state) => state.addNode)
  const addGroup = useModelBuilderStore((state) => state.addGroup)
  const deleteNode = useModelBuilderStore((state) => state.deleteNode)
  const deleteGroup = useModelBuilderStore((state) => state.deleteGroup)

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [type, setType] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [groupName, setGroupName] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null)
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false)
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null)
  const [pendingGroupNodeCount, setPendingGroupNodeCount] = useState(0)
  const [deleteNodeDialogOpen, setDeleteNodeDialogOpen] = useState(false)
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  const { parsedNodes } = useBulkNodeParser(bulkInput)

  const handleAddNode = (targetGroupId?: string) => {
    const finalGroupId = targetGroupId || (groupId && groupId !== 'none' ? groupId : undefined)
    if (label.trim() && type.trim()) {
      addNode({
        label: label.trim(),
        type: type.trim(),
        properties: [],
        groupId: finalGroupId
      })
      setLabel('')
      setType('')
      setGroupId('')
      setNodeDialogOpen(false)
    }
  }

  const handleAddNodeToGroup = (targetGroupId: string) => {
    setGroupId(targetGroupId)
    setNodeDialogOpen(true)
  }

  const handleAddGroup = () => {
    if (groupName.trim()) {
      addGroup(groupName.trim())
      setGroupName('')
      setGroupDialogOpen(false)
    }
  }

  const handleBulkAdd = () => {
    const processNodes = (nodesToAdd: Array<{ label: string; type: string; groupName?: string }>) => {
      const uniqueGroupNames = new Set<string>()
      nodesToAdd.forEach(node => {
        if (node.groupName) {
          uniqueGroupNames.add(node.groupName.trim())
        }
      })
      
      const groupNameToIdMap = new Map<string, string>()
      
      uniqueGroupNames.forEach(groupName => {
        const existingGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase())
        if (existingGroup) {
          groupNameToIdMap.set(groupName, existingGroup.id)
        } else {
          const newGroupId = addGroup(groupName)
          groupNameToIdMap.set(groupName, newGroupId)
        }
      })
      
      nodesToAdd.forEach((node) => {
        let finalGroupId: string | undefined = undefined
        
        if (node.groupName) {
          finalGroupId = groupNameToIdMap.get(node.groupName)
        } else if (groupId && groupId !== 'none') {
          finalGroupId = groupId
        }
        
        addNode({
          label: node.label,
          type: node.type,
          properties: [],
          groupId: finalGroupId
        })
      })
    }
    
    if (bulkImportFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileContent = e.target?.result as string
        const nodesToAdd = parseBulkNodeInput(fileContent)
        processNodes(nodesToAdd)
        
        setBulkInput('')
        setBulkImportFile(null)
        setBulkAddDialogOpen(false)
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = ''
        }
      }
      reader.readAsText(bulkImportFile)
      return
    }
    
    processNodes(parsedNodes)
    
    setBulkInput('')
    setBulkAddDialogOpen(false)
  }

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBulkImportFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setBulkInput(content)
      }
      reader.readAsText(file)
    }
  }

  const handleDeleteGroup = (targetGroupId: string) => {
    const nodeCount = nodes.filter(node => node.groupId === targetGroupId).length
    
    if (nodeCount > 0) {
      setPendingGroupId(targetGroupId)
      setPendingGroupNodeCount(nodeCount)
      setDeleteGroupDialogOpen(true)
    } else {
      deleteGroup(targetGroupId, false)
    }
  }

  const handleDeleteGroupWithNodes = () => {
    if (pendingGroupId) {
      deleteGroup(pendingGroupId, true)
      setPendingGroupId(null)
      setPendingGroupNodeCount(0)
      setDeleteGroupDialogOpen(false)
    }
  }

  const handleDeleteGroupOnly = () => {
    if (pendingGroupId) {
      deleteGroup(pendingGroupId, false)
      setPendingGroupId(null)
      setPendingGroupNodeCount(0)
      setDeleteGroupDialogOpen(false)
    }
  }

  const handleDeleteNode = (targetNodeId: string) => {
    setPendingNodeId(targetNodeId)
    setDeleteNodeDialogOpen(true)
  }

  const handleConfirmDeleteNode = () => {
    if (pendingNodeId) {
      deleteNode(pendingNodeId)
      setPendingNodeId(null)
      setDeleteNodeDialogOpen(false)
    }
  }

  return {
    nodeDialogOpen,
    setNodeDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    bulkAddDialogOpen,
    setBulkAddDialogOpen,
    deleteGroupDialogOpen,
    setDeleteGroupDialogOpen,
    deleteNodeDialogOpen,
    setDeleteNodeDialogOpen,
    label,
    setLabel,
    type,
    setType,
    groupId,
    setGroupId,
    groupName,
    setGroupName,
    bulkInput,
    setBulkInput,
    bulkImportFile,
    setBulkImportFile,
    pendingGroupId,
    setPendingGroupId,
    pendingGroupNodeCount,
    setPendingGroupNodeCount,
    pendingNodeId,
    bulkFileInputRef,
    handleAddNode,
    handleAddNodeToGroup,
    handleAddGroup,
    handleBulkAdd,
    handleBulkFileSelect,
    handleDeleteGroup,
    handleDeleteGroupWithNodes,
    handleDeleteGroupOnly,
    handleDeleteNode,
    handleConfirmDeleteNode
  }
}

