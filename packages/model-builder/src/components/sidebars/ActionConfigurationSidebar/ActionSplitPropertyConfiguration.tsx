import { useState, useEffect } from 'react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionSplitPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  splitPropertyConfig: ActionConfigurationState['splitPropertyConfig']
  onSplitPropertyConfigChange: (config: ActionConfigurationState['splitPropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionSplitPropertyConfiguration({
  actionNodeId,
  actionNode,
  splitPropertyConfig,
  onSplitPropertyConfigChange,
  onUpdateActionNode
}: ActionSplitPropertyConfigurationProps) {
  const [targetPropsString, setTargetPropsString] = useState('')

  useEffect(() => {
    if (splitPropertyConfig.targetProperties) {
      const currentString = splitPropertyConfig.targetProperties.join(', ')
      if (currentString !== targetPropsString.split(',').map(p => p.trim()).filter(Boolean).join(', ')) {
        setTargetPropsString(currentString)
      }
    }
  }, [splitPropertyConfig.targetProperties])

  if (!actionNode) return null

  const handleTargetPropsChange = (value: string) => {
    setTargetPropsString(value)
    const props = value.split(',').map(p => p.trim()).filter(Boolean)
    const updated = { ...splitPropertyConfig, targetProperties: props }
    onSplitPropertyConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  const handleConfigChange = (key: keyof ActionConfigurationState['splitPropertyConfig'], value: any) => {
    const updated = { ...splitPropertyConfig, [key]: value }
    onSplitPropertyConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Split Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Property</Label>
          <Input
            placeholder="e.g., fullName"
            className="h-8 text-xs"
            value={splitPropertyConfig.sourceProperty}
            onChange={(e) => handleConfigChange('sourceProperty', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Separator</Label>
          <Input
            placeholder="e.g., ' ' (space), ',' (comma)"
            className="h-8 text-xs"
            value={splitPropertyConfig.separator}
            onChange={(e) => handleConfigChange('separator', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Properties</Label>
          <Input
            placeholder="firstName, lastName"
            className="h-8 text-xs"
            value={targetPropsString}
            onChange={(e) => handleTargetPropsChange(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Comma-separated list of properties to create.</p>
        </div>
      </div>
    </CollapsibleSection>
  )
}

