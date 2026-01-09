import { useCallback } from 'react'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import type { Condition, ConditionGroup, ConditionType } from '../../components/sidebars/ToolConfigurationSidebar'

export function useToolConditionBuilder(toolNodeId: string | null) {
  const conditionGroups = useToolConfigurationStore((state) => state.conditionGroups)
  const setConditionGroups = useToolConfigurationStore((state) => state.setConditionGroups)
  const selectedConditionType = useToolConfigurationStore((state) => state.selectedConditionType)
  const setSelectedConditionType = useToolConfigurationStore((state) => state.setSelectedConditionType)
  const childInputValues = useToolConfigurationStore((state) => state.childInputValues)
  const setChildInputValues = useToolConfigurationStore((state) => state.setChildInputValues)
  const ancestorInputValues = useToolConfigurationStore((state) => state.ancestorInputValues)
  const setAncestorInputValues = useToolConfigurationStore((state) => state.setAncestorInputValues)
  const updateToolNode = useToolCanvasStore((state) => state.updateNode)
  const toolNode = useToolCanvasStore((state) => state.nodes.find(n => n.id === toolNodeId))
  const getState = useToolConfigurationStore.getState

  const generateGroupId = () => `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  const handleAddConditionGroup = useCallback((xmlParent?: string, xmlAncestors?: string[]) => {
    const newCondition: Condition = {
      type: selectedConditionType,
      internalOperator: 'OR' as const
    }
    if (selectedConditionType === 'HasParent' && xmlParent) {
      newCondition.value = xmlParent
    } else if (selectedConditionType === 'HasAncestor' && xmlAncestors && xmlAncestors.length > 0) {
      newCondition.values = [xmlAncestors[0]]
    }

    const newGroup: ConditionGroup = {
      id: generateGroupId(),
      conditions: [newCondition],
      internalOperator: 'AND' as const,
      operator: conditionGroups.length > 0 ? ('AND' as const) : undefined
    }
    const updated = [...conditionGroups, newGroup]
    setConditionGroups(updated)
    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, selectedConditionType, setConditionGroups, toolNodeId, toolNode, updateToolNode])

  const handleAddConditionToGroup = useCallback((groupId: string, xmlParent?: string, xmlAncestors?: string[]) => {
    const updated = conditionGroups.map((group) => {
      if (group.id === groupId) {
        const newCondition: Condition = {
          type: selectedConditionType,
          internalOperator: 'OR' as const
        }
        if (selectedConditionType === 'HasParent' && xmlParent) {
          newCondition.value = xmlParent
        } else if (selectedConditionType === 'HasAncestor' && xmlAncestors && xmlAncestors.length > 0) {
          newCondition.values = [xmlAncestors[0]]
        }
        return {
          ...group,
          conditions: [...group.conditions, newCondition]
        }
      }
      return group
    })
    setConditionGroups(updated)
    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, selectedConditionType, setConditionGroups, toolNodeId, toolNode, updateToolNode])

  const handleUpdateCondition = useCallback((groupId: string, conditionIndex: number, updates: Partial<Condition>) => {
    const updated = conditionGroups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map((c, i) => (i === conditionIndex ? { ...c, ...updates } : c))
        }
      }
      return group
    })
    setConditionGroups(updated)
    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, setConditionGroups, toolNodeId, toolNode, updateToolNode])

  const handleRemoveCondition = useCallback((groupId: string, conditionIndex: number) => {
    const updated = conditionGroups.map((group) => {
      if (group.id === groupId) {
        const newConditions = group.conditions.filter((_, i) => i !== conditionIndex)
        if (newConditions.length === 0) {
          return null
        }
        return {
          ...group,
          conditions: newConditions
        }
      }
      return group
    }).filter(Boolean) as ConditionGroup[]

    setConditionGroups(updated)

    const currentState = getState()
    const newChildInputValues = { ...currentState.childInputValues }
    const newAncestorInputValues = { ...currentState.ancestorInputValues }

    delete newChildInputValues[`${groupId}-${conditionIndex}`]
    delete newAncestorInputValues[`${groupId}-${conditionIndex}`]

    setChildInputValues(newChildInputValues)
    setAncestorInputValues(newAncestorInputValues)

    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, setConditionGroups, getState, setChildInputValues, setAncestorInputValues, toolNodeId, toolNode, updateToolNode])

  const handleRemoveGroup = useCallback((groupId: string) => {
    const updated = conditionGroups.filter(g => g.id !== groupId)
    setConditionGroups(updated)
    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, setConditionGroups, toolNodeId, toolNode, updateToolNode])

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<ConditionGroup>) => {
    const updated = conditionGroups.map((group) => {
      if (group.id === groupId) {
        return { ...group, ...updates }
      }
      return group
    })
    setConditionGroups(updated)
    if (toolNodeId) {
      updateToolNode(toolNodeId, {
        config: { ...toolNode?.config, conditionGroups: updated }
      })
    }
  }, [conditionGroups, setConditionGroups, toolNodeId, toolNode, updateToolNode])

  return {
    conditionGroups,
    selectedConditionType,
    setSelectedConditionType,
    childInputValues,
    setChildInputValues,
    ancestorInputValues,
    setAncestorInputValues,
    handleAddConditionGroup,
    handleAddConditionToGroup,
    handleUpdateCondition,
    handleRemoveCondition,
    handleRemoveGroup,
    handleUpdateGroup
  }
}

