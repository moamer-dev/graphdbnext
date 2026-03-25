import { useCallback, useMemo } from 'react'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import type { Condition, ConditionGroup, ConditionType } from '../../components/sidebars/ToolConfigurationSidebar'

export function useToolConditionBuilder() {
  const config = useToolConfigurationStore((state) => state.config)
  const updateConfig = useToolConfigurationStore((state) => state.updateConfig)
  
  const conditionGroups = useMemo(() => (config.conditionGroups as ConditionGroup[]) || [], [config.conditionGroups])
  const selectedConditionType = (config.selectedConditionType as ConditionType) || 'HasAttribute'
  const childInputValues = (config.childInputValues as Record<string, string>) || {}
  const ancestorInputValues = (config.ancestorInputValues as Record<string, string>) || {}
  
  const setSelectedConditionType = useCallback((type: ConditionType) => updateConfig({ selectedConditionType: type }), [updateConfig])
  const setConditionGroups = useCallback((groups: ConditionGroup[]) => updateConfig({ conditionGroups: groups }), [updateConfig])
  const setChildInputValues = useCallback((values: Record<string, string>) => updateConfig({ childInputValues: values }), [updateConfig])
  const setAncestorInputValues = useCallback((values: Record<string, string>) => updateConfig({ ancestorInputValues: values }), [updateConfig])
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

