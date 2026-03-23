import { useCallback } from 'react'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import type { Condition, ConditionGroup, ConditionType } from '../../components/sidebars/ToolConfigurationSidebar'

export function useToolConditionBuilder(toolNodeId: string | null) {
  const config = useToolConfigurationStore((state) => state.config)
  const updateConfig = useToolConfigurationStore((state) => state.updateConfig)
  
  const conditionGroups = (config.conditionGroups as ConditionGroup[]) || []
  const selectedConditionType = (config.selectedConditionType as ConditionType) || 'HasAttribute'
  const childInputValues = (config.childInputValues as Record<string, string>) || {}
  const ancestorInputValues = (config.ancestorInputValues as Record<string, string>) || {}
  
  const setSelectedConditionType = (type: ConditionType) => updateConfig({ selectedConditionType: type })
  const setConditionGroups = (groups: ConditionGroup[]) => updateConfig({ conditionGroups: groups })
  const setChildInputValues = (values: Record<string, string>) => updateConfig({ childInputValues: values })
  const setAncestorInputValues = (values: Record<string, string>) => updateConfig({ ancestorInputValues: values })
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
  }, [conditionGroups, selectedConditionType, setConditionGroups])

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
  }, [conditionGroups, selectedConditionType, setConditionGroups])

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
  }, [conditionGroups, setConditionGroups])

  const handleRemoveCondition = useCallback((groupId: string, conditionIndex: number) => {
    const updated = conditionGroups.map((group) => {
      if (group.id === groupId) {
        const newConditions = group.conditions.filter((_, i) => i !== conditionIndex)
        if (newConditions.length === 0) {
          // Handled downstream by handleRemoveGroup if caller uses it, but here we just leave empty
          // Actually, we should probably auto-remove empty groups later
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
    const newChildInputValues = { ...((currentState.config.childInputValues as Record<string, string>) || {}) }
    const newAncestorInputValues = { ...((currentState.config.ancestorInputValues as Record<string, string>) || {}) }

    delete newChildInputValues[`${groupId}-${conditionIndex}`]
    delete newAncestorInputValues[`${groupId}-${conditionIndex}`]

    setChildInputValues(newChildInputValues)
    setAncestorInputValues(newAncestorInputValues)
  }, [conditionGroups, setConditionGroups, getState, setChildInputValues, setAncestorInputValues])

  const handleRemoveGroup = useCallback((groupId: string) => {
    const updated = conditionGroups.filter((g) => g.id !== groupId)
    // If we removed the first group but have others, fix the operator of the new first group
    if (updated.length > 0 && updated[0].operator) {
      updated[0] = { ...updated[0], operator: undefined }
    }
    setConditionGroups(updated)
  }, [conditionGroups, setConditionGroups])

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<ConditionGroup>) => {
    const updated = conditionGroups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    setConditionGroups(updated)
  }, [conditionGroups, setConditionGroups])

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

