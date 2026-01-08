'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { Plus, Trash2, X } from 'lucide-react'
import type { Condition, ConditionType, ConditionGroup } from '../ToolConfigurationSidebar'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'

interface ConditionBuilderHook {
  conditionGroups: ConditionGroup[]
  selectedConditionType: ConditionType
  setSelectedConditionType: (type: ConditionType) => void
  childInputValues: Record<string, string>
  setChildInputValues: (values: Record<string, string>) => void
  ancestorInputValues: Record<string, string>
  setAncestorInputValues: (values: Record<string, string>) => void
  handleAddConditionGroup: (xmlParent?: string, xmlAncestors?: string[]) => void
  handleAddConditionToGroup: (groupId: string, xmlParent?: string, xmlAncestors?: string[]) => void
  handleUpdateCondition: (groupId: string, conditionIndex: number, updates: Partial<Condition>) => void
  handleRemoveCondition: (groupId: string, conditionIndex: number) => void
  handleRemoveGroup: (groupId: string) => void
  handleUpdateGroup: (groupId: string, updates: Partial<ConditionGroup>) => void
}

interface ToolConditionBuilderProps {
  conditionBuilder: ConditionBuilderHook
  xmlParent?: string
  xmlAncestors?: string[]
  xmlChildren?: Array<{ name: string; count: number }>
}

export function ToolConditionBuilder({
  conditionBuilder,
  xmlParent,
  xmlAncestors,
  xmlChildren
}: ToolConditionBuilderProps) {
  const conditionGroups = conditionBuilder.conditionGroups
  const selectedConditionType = conditionBuilder.selectedConditionType
  const setSelectedConditionType = conditionBuilder.setSelectedConditionType
  const childInputValues = conditionBuilder.childInputValues
  const setChildInputValues = conditionBuilder.setChildInputValues
  const ancestorInputValues = conditionBuilder.ancestorInputValues
  const setAncestorInputValues = conditionBuilder.setAncestorInputValues
  const handleAddConditionGroup = conditionBuilder.handleAddConditionGroup
  const handleAddConditionToGroup = conditionBuilder.handleAddConditionToGroup
  const handleUpdateCondition = conditionBuilder.handleUpdateCondition
  const handleRemoveCondition = conditionBuilder.handleRemoveCondition
  const handleRemoveGroup = conditionBuilder.handleRemoveGroup
  const handleUpdateGroup = conditionBuilder.handleUpdateGroup
  
  const getState = useToolConfigurationStore.getState

  const getConditionInputs = (condition: Condition, groupId: string, conditionIndex: number) => {
    switch (condition.type) {
      case 'HasChildren':
      case 'HasNoChildren':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Child Element Names</Label>
              {condition.values && condition.values.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Internal logic:</span>
                  <Select
                    value={condition.internalOperator || 'OR'}
                    onValueChange={(value) => {
                      handleUpdateCondition(groupId, conditionIndex, {
                        internalOperator: value as 'AND' | 'OR'
                      })
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OR">OR</SelectItem>
                      <SelectItem value="AND">AND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={childInputValues[`${groupId}-${conditionIndex}`] || ''}
                onChange={(e) => {
                  setChildInputValues({
                    ...getState().childInputValues,
                    [`${groupId}-${conditionIndex}`]: e.target.value
                  })
                }}
                placeholder="Enter child element name"
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newValue = e.currentTarget.value.trim()
                    if (!condition.values?.includes(newValue)) {
                      handleUpdateCondition(groupId, conditionIndex, {
                        values: [...(condition.values || []), newValue],
                        internalOperator: condition.internalOperator || 'OR'
                      })
                      const newState = { ...getState().childInputValues }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setChildInputValues(newState)
                    }
                  }
                }}
              />
              {xmlChildren && xmlChildren.length > 0 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !condition.values?.includes(value)) {
                      handleUpdateCondition(groupId, conditionIndex, {
                        values: [...(condition.values || []), value],
                        internalOperator: condition.internalOperator || 'OR'
                      })
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Or select" />
                  </SelectTrigger>
                  <SelectContent>
                    {xmlChildren.filter((child) => !condition.values?.includes(child.name)).map((child) => (
                      <SelectItem key={child.name} value={child.name}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {condition.values && condition.values.length > 0 && (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {condition.values.map((val, idx) => (
                    <span
                      key={`${groupId}-${conditionIndex}-child-${val}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                    >
                      {val}
                      <button
                        onClick={() => {
                          handleUpdateCondition(groupId, conditionIndex, {
                            values: condition.values?.filter((_, i) => i !== idx)
                          })
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {condition.values.length > 1 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    Element must have: {condition.values.join(` ${condition.internalOperator || 'OR'} `)}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'HasAncestor':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ancestor Element Names</Label>
              {condition.values && condition.values.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Internal logic:</span>
                  <Select
                    value={condition.internalOperator || 'OR'}
                    onValueChange={(value) => {
                      handleUpdateCondition(groupId, conditionIndex, {
                        internalOperator: value as 'AND' | 'OR'
                      })
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OR">OR</SelectItem>
                      <SelectItem value="AND">AND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={ancestorInputValues[`${groupId}-${conditionIndex}`] || ''}
                onChange={(e) => {
                  setAncestorInputValues({
                    ...getState().ancestorInputValues,
                    [`${groupId}-${conditionIndex}`]: e.target.value
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newValue = e.currentTarget.value.trim()
                    if (!condition.values?.includes(newValue)) {
                      handleUpdateCondition(groupId, conditionIndex, {
                        values: [...(condition.values || []), newValue],
                        internalOperator: condition.internalOperator || 'OR',
                        value: undefined
                      })
                      const newState = { ...getState().ancestorInputValues }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setAncestorInputValues(newState)
                    }
                  }
                }}
                placeholder="Enter ancestor element name"
                className="h-8 text-xs flex-1"
              />
              {xmlAncestors && xmlAncestors.length > 0 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !condition.values?.includes(value)) {
                      handleUpdateCondition(groupId, conditionIndex, {
                        values: [...(condition.values || []), value],
                        internalOperator: condition.internalOperator || 'OR',
                        value: undefined
                      })
                      const newState = { ...getState().ancestorInputValues }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setAncestorInputValues(newState)
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Or select" />
                  </SelectTrigger>
                  <SelectContent>
                    {xmlAncestors
                      .filter((ancestor) => !condition.values?.includes(ancestor))
                      .map((ancestor) => (
                        <SelectItem key={ancestor} value={ancestor}>
                          {ancestor}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {condition.values && condition.values.length > 0 && (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {condition.values.map((val, idx) => (
                    <span
                      key={`${groupId}-${conditionIndex}-ancestor-${val}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                    >
                      {val}
                      <button
                        onClick={() => {
                          handleUpdateCondition(groupId, conditionIndex, {
                            values: condition.values?.filter((_, i) => i !== idx)
                          })
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {condition.values.length > 1 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    Element must have ancestor: {condition.values.join(` ${condition.internalOperator || 'OR'} `)}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'HasParent':
        return (
          <div className="space-y-2">
            <Label className="text-xs">Parent Element Name</Label>
            {xmlParent && (
              <div className="text-[10px] text-muted-foreground mb-1">
                Detected parent: {xmlParent}
              </div>
            )}
            <Input
              value={condition.value || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
              }}
              placeholder={xmlParent ? `Default: ${xmlParent}` : 'Enter parent element name'}
              className="h-8 text-xs"
            />
          </div>
        )

      case 'HasAttribute':
        return (
          <div className="space-y-2">
            <Label className="text-xs">Attribute Name</Label>
            <Input
              value={condition.attributeName || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { attributeName: e.target.value })
              }}
              placeholder="e.g., id, xml:id"
              className="h-8 text-xs"
            />
          </div>
        )

      case 'ElementNameEquals':
        return (
          <div className="space-y-2">
            <Label className="text-xs">Element Name</Label>
            <Input
              value={condition.value || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
              }}
              placeholder="Element name to match"
              className="h-8 text-xs"
            />
          </div>
        )

      case 'AttributeValueEquals':
        return (
          <div className="space-y-2">
            <Label className="text-xs">Attribute Name</Label>
            <Input
              value={condition.attributeName || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { attributeName: e.target.value })
              }}
              placeholder="Attribute name"
              className="h-8 text-xs"
            />
            <Label className="text-xs">Expected Value</Label>
            <Input
              value={condition.value || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
              }}
              placeholder="Value to match"
              className="h-8 text-xs"
            />
          </div>
        )

      case 'ChildCount':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min Count</Label>
                <Input
                  type="number"
                  value={condition.min || ''}
                  onChange={(e) => {
                    handleUpdateCondition(groupId, conditionIndex, {
                      min: e.target.value ? parseInt(e.target.value, 10) : undefined
                    })
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Max Count</Label>
                <Input
                  type="number"
                  value={condition.max || ''}
                  onChange={(e) => {
                    handleUpdateCondition(groupId, conditionIndex, {
                      max: e.target.value ? parseInt(e.target.value, 10) : undefined
                    })
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )

      case 'HasTextContent':
        return (
          <div className="text-xs text-muted-foreground">
            This condition checks if the element contains text content.
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <div className="mb-2">
        <Label className="text-xs font-medium">Condition Groups</Label>
      </div>

      {conditionGroups.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4 border rounded">
          No condition groups defined. Add a condition group to configure the tool.
        </div>
      ) : (
        <div className="space-y-4">
          {conditionGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="border-2 rounded-lg p-3 space-y-3 bg-primary/5 border-primary/20"
            >
              <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                <div className="flex items-center gap-2 flex-wrap">
                  {groupIndex > 0 && (
                    <>
                      <Select
                        value={group.operator || 'AND'}
                        onValueChange={(value) => {
                          handleUpdateGroup(group.id, {
                            operator: value as 'AND' | 'OR'
                          })
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-16 border-primary/30 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground font-medium">then</span>
                    </>
                  )}
                  <span className="text-xs font-bold text-primary">Group {groupIndex + 1}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {group.conditions.length > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Internal:</span>
                      <Select
                        value={group.internalOperator || 'AND'}
                        onValueChange={(value) => {
                          handleUpdateGroup(group.id, {
                            internalOperator: value as 'AND' | 'OR'
                          })
                        }}
                      >
                        <SelectTrigger className="h-6 text-xs w-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveGroup(group.id)}
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    title="Remove group"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                {group.conditions.map((condition, conditionIndex) => (
                  <div
                    key={`${group.id}-${conditionIndex}-${condition.type}`}
                    className="border rounded p-2 space-y-2 bg-background"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={condition.type}
                        onValueChange={(value) => {
                          const newType = value as ConditionType
                          const resetCondition: Partial<Condition> = {
                            type: newType,
                            internalOperator: 'OR' as const
                          }
                          if (newType === 'HasParent' && xmlParent) {
                            resetCondition.value = xmlParent
                          } else if (newType === 'HasAncestor' && xmlAncestors && xmlAncestors.length > 0) {
                            resetCondition.values = [xmlAncestors[0]]
                          } else {
                            resetCondition.value = undefined
                            resetCondition.values = undefined
                            resetCondition.attributeName = undefined
                            resetCondition.min = undefined
                            resetCondition.max = undefined
                          }
                          handleUpdateCondition(group.id, conditionIndex, resetCondition)
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-full max-w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HasChildren">Has Children</SelectItem>
                          <SelectItem value="HasNoChildren">Has No Children</SelectItem>
                          <SelectItem value="HasAncestor">Has Ancestor</SelectItem>
                          <SelectItem value="HasParent">Has Parent</SelectItem>
                          <SelectItem value="HasAttribute">Has Attribute</SelectItem>
                          <SelectItem value="HasTextContent">Has Text Content</SelectItem>
                          <SelectItem value="ElementNameEquals">Element Name Equals</SelectItem>
                          <SelectItem value="AttributeValueEquals">Attribute Value Equals</SelectItem>
                          <SelectItem value="ChildCount">Child Count</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCondition(group.id, conditionIndex)}
                        className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    {getConditionInputs(condition, group.id, conditionIndex)}
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddConditionToGroup(group.id)}
                    className="h-7 w-full text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition to Group
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Select
            value={selectedConditionType}
            onValueChange={(value) => {
              setSelectedConditionType(value as ConditionType)
            }}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Select condition type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HasChildren">Has Children</SelectItem>
              <SelectItem value="HasNoChildren">Has No Children</SelectItem>
              <SelectItem value="HasAncestor">Has Ancestor</SelectItem>
              <SelectItem value="HasParent">Has Parent</SelectItem>
              <SelectItem value="HasAttribute">Has Attribute</SelectItem>
              <SelectItem value="HasTextContent">Has Text Content</SelectItem>
              <SelectItem value="ElementNameEquals">Element Name Equals</SelectItem>
              <SelectItem value="AttributeValueEquals">Attribute Value Equals</SelectItem>
              <SelectItem value="ChildCount">Child Count</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => handleAddConditionGroup(xmlParent, xmlAncestors)}
            className="h-8 px-3 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Group
          </Button>
        </div>
      </div>
    </div>
  )
}

