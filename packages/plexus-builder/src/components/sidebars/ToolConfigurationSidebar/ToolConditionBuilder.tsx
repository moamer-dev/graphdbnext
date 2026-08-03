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
import { Plus, Trash2, X, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import type { Condition, ConditionType, ConditionGroup } from '../ToolConfigurationSidebar'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'
import { useState } from 'react'
import { cn } from '../../../utils/cn'

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

function ConditionGroupItem({ 
  group, 
  groupIndex, 
  conditionBuilder,
  xmlParent,
  xmlAncestors,
  xmlChildren,
  xmlDescendants,
  getConditionInputs
}: { 
  group: ConditionGroup
  groupIndex: number
  conditionBuilder: ConditionBuilderHook
  xmlParent?: string
  xmlAncestors?: string[]
  xmlChildren?: Array<{ name: string; count: number }>
  xmlDescendants?: string[]
  getConditionInputs: (condition: Condition, groupId: string, conditionIndex: number) => React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(true)
  const { handleUpdateGroup, handleRemoveGroup, handleAddConditionToGroup, handleUpdateCondition, handleRemoveCondition } = conditionBuilder

  return (
    <div className={cn(
      "rounded-md border transition-all duration-200 overflow-hidden",
      isOpen 
        ? "bg-primary/[0.04] border-primary/30" 
        : "bg-primary/[0.02] border-primary/10 hover:border-primary/20 hover:bg-primary/[0.04]"
    )}>
      <div 
        className={cn(
          "flex items-center gap-2 cursor-pointer group py-1.5 px-2.5",
          isOpen ? "bg-primary/5" : "bg-transparent"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary" />}
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold tracking-tight text-primary/90 uppercase">
              Group {groupIndex + 1}
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary/70 border border-primary/20 uppercase tracking-wider">
              {group.conditions.length} COND
            </span>
          </div>
          <div className="flex items-center gap-2">
            {groupIndex > 0 && (
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={group.operator || 'AND'}
                  onValueChange={(value) => handleUpdateGroup(group.id, { operator: value as 'AND' | 'OR' })}
                >
                  <SelectTrigger className="h-6 text-[9px] w-14 font-black bg-background border-primary/20 text-primary/70 uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND" className="text-[10px]">AND</SelectItem>
                    <SelectItem value="OR" className="text-[10px]">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveGroup(group.id)
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 space-y-3 pt-0 border-t border-primary/10">
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest shrink-0">
              Internal Logic flow
            </div>
            {group.conditions.length > 1 && (
              <Select
                value={group.internalOperator || 'AND'}
                onValueChange={(value) => handleUpdateGroup(group.id, { internalOperator: value as 'AND' | 'OR' })}
              >
                <SelectTrigger className="h-6 text-[9px] w-14 font-black bg-background border-primary/10 text-primary/60 uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND" className="text-[10px]">AND</SelectItem>
                  <SelectItem value="OR" className="text-[10px]">OR</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            {group.conditions.map((condition, conditionIndex) => (
              <div
                key={`${group.id}-${conditionIndex}-${condition.type}`}
                className="rounded-md border border-primary/10 bg-white/40 p-2 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
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
                      <SelectTrigger className="h-7 text-[10px] font-bold bg-background/50 border-primary/10 hover:border-primary/20 transition-all uppercase tracking-tight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HasChildren" className="text-xs">Has Children</SelectItem>
                        <SelectItem value="HasNoChildren" className="text-xs">Has No Children</SelectItem>
                        <SelectItem value="HasAncestor" className="text-xs">Has Ancestor</SelectItem>
                        <SelectItem value="HasParent" className="text-xs">Has Parent</SelectItem>
                        <SelectItem value="HasDescendant" className="text-xs">Has Descendant</SelectItem>
                        <SelectItem value="HasAttribute" className="text-xs">Has Attribute</SelectItem>
                        <SelectItem value="HasTextContent" className="text-xs">Has Text Content</SelectItem>
                        <SelectItem value="ElementNameEquals" className="text-xs">Element Name Equals</SelectItem>
                        <SelectItem value="AttributeValueEquals" className="text-xs">Attribute Value Equals</SelectItem>
                        <SelectItem value="ChildCount" className="text-xs">Child Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCondition(group.id, conditionIndex)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="pl-3 border-l-2 border-primary/10">
                  {getConditionInputs(condition, group.id, conditionIndex)}
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddConditionToGroup(group.id)}
            className="h-7 w-full text-[9px] font-black uppercase tracking-widest bg-background border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/[0.02] text-primary/50 transition-all"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>
      )}
    </div>
  )
}

interface ToolConditionBuilderProps {
  conditionBuilder: ConditionBuilderHook
  xmlParent?: string
  xmlAncestors?: string[]
  xmlChildren?: Array<{ name: string; count: number }>
  xmlDescendants?: string[]
}

export function ToolConditionBuilder({
  conditionBuilder,
  xmlParent,
  xmlAncestors,
  xmlChildren,
  xmlDescendants
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
      case 'HasDescendant': {
        const isDescendant = condition.type === 'HasDescendant'
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">{isDescendant ? 'Descendant Names' : 'Child Element Names'}</Label>
              {condition.values && condition.values.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest">Logic:</span>
                  <Select
                    value={condition.internalOperator || 'OR'}
                    onValueChange={(value) => {
                      handleUpdateCondition(groupId, conditionIndex, {
                        internalOperator: value as 'AND' | 'OR'
                      })
                    }}
                  >
                    <SelectTrigger className="h-5 text-[9px] w-14 font-black p-1 bg-background border-primary/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OR" className="text-[10px]">OR</SelectItem>
                      <SelectItem value="AND" className="text-[10px]">AND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={childInputValues[`${groupId}-${conditionIndex}`] || ''}
                onChange={(e) => {
                  setChildInputValues({
                    ...((getState().config.childInputValues as Record<string, string>) || {}),
                    [`${groupId}-${conditionIndex}`]: e.target.value
                  })
                }}
                placeholder={isDescendant ? "Enter descendant name" : "Enter child element name"}
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newValue = e.currentTarget.value.trim()
                    if (!condition.values?.includes(newValue)) {
                      handleUpdateCondition(groupId, conditionIndex, {
                        values: [...(condition.values || []), newValue],
                        internalOperator: condition.internalOperator || 'OR'
                      })
                      const newState = { ...((getState().config.childInputValues as Record<string, string>) || {}) }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setChildInputValues(newState)
                    }
                  }
                }}
              />
              {((isDescendant && xmlDescendants && xmlDescendants.length > 0) || (!isDescendant && xmlChildren && xmlChildren.length > 0)) && (
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
                  <SelectTrigger className="h-8 text-xs w-28 bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Quick Add" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isDescendant ? xmlDescendants! : xmlChildren!.map(c => c.name))
                      .filter((name) => !condition.values?.includes(name))
                      .map((name) => (
                        <SelectItem key={name} value={name} className="text-xs">
                          {name}
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
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-[10px] font-bold text-primary/70"
                    >
                      {val}
                      <button
                        onClick={() => {
                          handleUpdateCondition(groupId, conditionIndex, {
                            values: condition.values?.filter((_, i) => i !== idx)
                          })
                        }}
                        className="text-primary/30 hover:text-red-500 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      }

      case 'HasAncestor':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Ancestor Element Names</Label>
              {condition.values && condition.values.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest">Logic:</span>
                  <Select
                    value={condition.internalOperator || 'OR'}
                    onValueChange={(value) => {
                      handleUpdateCondition(groupId, conditionIndex, {
                        internalOperator: value as 'AND' | 'OR'
                      })
                    }}
                  >
                    <SelectTrigger className="h-5 text-[9px] w-14 font-black p-1 bg-background border-primary/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OR" className="text-[10px]">OR</SelectItem>
                      <SelectItem value="AND" className="text-[10px]">AND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={ancestorInputValues[`${groupId}-${conditionIndex}`] || ''}
                onChange={(e) => {
                  setAncestorInputValues({
                    ...((getState().config.ancestorInputValues as Record<string, string>) || {}),
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
                      const newState = { ...((getState().config.ancestorInputValues as Record<string, string>) || {}) }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setAncestorInputValues(newState)
                    }
                  }
                }}
                placeholder="Enter ancestor element name"
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all flex-1"
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
                      const newState = { ...((getState().config.ancestorInputValues as Record<string, string>) || {}) }
                      delete newState[`${groupId}-${conditionIndex}`]
                      setAncestorInputValues(newState)
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-28 bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Quick Add" />
                  </SelectTrigger>
                  <SelectContent>
                    {xmlAncestors
                      .filter((ancestor) => !condition.values?.includes(ancestor))
                      .map((ancestor) => (
                        <SelectItem key={ancestor} value={ancestor} className="text-xs">
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
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-[10px] font-bold text-primary/70"
                    >
                      {val}
                      <button
                        onClick={() => {
                          handleUpdateCondition(groupId, conditionIndex, {
                            values: condition.values?.filter((_, i) => i !== idx)
                          })
                        }}
                        className="text-primary/30 hover:text-red-500 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'HasParent': {
        const parentOptions = xmlAncestors ? [...new Set([xmlParent, ...xmlAncestors].filter(Boolean) as string[])] : (xmlParent ? [xmlParent] : [])

        return (
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Parent Element Name</Label>
            <div className="flex gap-2">
              <input
                value={condition.value || ''}
                onChange={(e) => {
                  handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
                }}
                placeholder={xmlParent ? `Default: ${xmlParent}` : 'Enter parent element name'}
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all flex-1"
              />
              {parentOptions.length > 0 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    handleUpdateCondition(groupId, conditionIndex, { value })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-28 bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Quick Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )
      }

      case 'HasAttribute':
        return (
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Attribute Name</Label>
            <input
              value={condition.attributeName || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { attributeName: e.target.value })
              }}
              placeholder="e.g., id, xml:id"
              className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        )

      case 'ElementNameEquals':
        return (
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Element Name</Label>
            <input
              value={condition.value || ''}
              onChange={(e) => {
                handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
              }}
              placeholder="Element name to match"
              className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        )

      case 'ChildCount':
        return (
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Min Count</label>
              <input
                type="number"
                value={condition.min || ''}
                onChange={(e) => {
                  handleUpdateCondition(groupId, conditionIndex, {
                    min: e.target.value ? parseInt(e.target.value, 10) : undefined
                  })
                }}
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Max Count</label>
              <input
                type="number"
                value={condition.max || ''}
                onChange={(e) => {
                  handleUpdateCondition(groupId, conditionIndex, {
                    max: e.target.value ? parseInt(e.target.value, 10) : undefined
                  })
                }}
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        )

      case 'AttributeValueEquals':
        return (
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Attr Name</label>
              <input
                value={condition.attributeName || ''}
                onChange={(e) => {
                  handleUpdateCondition(groupId, conditionIndex, { attributeName: e.target.value })
                }}
                placeholder="Name"
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Expected</label>
              <input
                value={condition.value || ''}
                onChange={(e) => {
                  handleUpdateCondition(groupId, conditionIndex, { value: e.target.value })
                }}
                placeholder="Value"
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        )

      case 'HasTextContent':
        return (
          <div className="text-[10px] text-primary/40 font-medium italic py-1">
            Validates existence of text content within target element.
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">Condition Groups</Label>
        <span className="text-[9px] font-bold text-primary/30 uppercase tracking-wider">Logic Builder</span>
      </div>

      {conditionGroups.length === 0 ? (
        <div className="text-[10px] text-primary/50 text-center py-8 border border-dashed border-primary/20 rounded-md bg-primary/[0.02] italic leading-relaxed">
          No condition groups defined.<br />Add a group to start configuring Boolean logic.
        </div>
      ) : (
        <div className="space-y-3">
          {conditionGroups.map((group, groupIndex) => (
            <ConditionGroupItem
              key={group.id}
              group={group}
              groupIndex={groupIndex}
              conditionBuilder={conditionBuilder}
              xmlParent={xmlParent}
              xmlAncestors={xmlAncestors}
              xmlChildren={xmlChildren}
              xmlDescendants={xmlDescendants}
              getConditionInputs={getConditionInputs}
            />
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-primary/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Settings2 className="absolute left-2.5 top-2.5 h-3 w-3 text-primary/30 group-hover:text-primary transition-colors" />
            <Select
              value={selectedConditionType}
              onValueChange={(value) => {
                setSelectedConditionType(value as ConditionType)
              }}
            >
              <SelectTrigger className="h-8 text-[11px] pl-8 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                <SelectValue placeholder="Condition Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HasChildren" className="text-xs">Has Children</SelectItem>
                <SelectItem value="HasNoChildren" className="text-xs">Has No Children</SelectItem>
                <SelectItem value="HasAncestor" className="text-xs">Has Ancestor</SelectItem>
                <SelectItem value="HasParent" className="text-xs">Has Parent</SelectItem>
                <SelectItem value="HasAttribute" className="text-xs">Has Attribute</SelectItem>
                <SelectItem value="HasTextContent" className="text-xs">Has Text Content</SelectItem>
                <SelectItem value="ElementNameEquals" className="text-xs">Element Name Equals</SelectItem>
                <SelectItem value="AttributeValueEquals" className="text-xs">Attribute Value Equals</SelectItem>
                <SelectItem value="ChildCount" className="text-xs">Child Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => handleAddConditionGroup(xmlParent, xmlAncestors)}
            className="h-8 px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Group
          </Button>
        </div>
      </div>
    </div>
  )
}

