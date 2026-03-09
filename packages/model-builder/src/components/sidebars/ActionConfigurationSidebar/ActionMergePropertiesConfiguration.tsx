import { useState, useEffect } from 'react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionMergePropertiesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  mergePropertiesConfig: ActionConfigurationState['mergePropertiesConfig']
  onMergePropertiesConfigChange: (config: ActionConfigurationState['mergePropertiesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionMergePropertiesConfiguration({
  actionNodeId,
  actionNode,
  mergePropertiesConfig,
  onMergePropertiesConfigChange,
  onUpdateActionNode
}: ActionMergePropertiesConfigurationProps) {
  const [sourcePropsString, setSourcePropsString] = useState('')

  useEffect(() => {
    if (mergePropertiesConfig.sourceProperties) {
      const currentString = mergePropertiesConfig.sourceProperties.join(', ')
      // Only update if it's different to avoid resetting user input while typing
      if (currentString !== sourcePropsString.split(',').map(p => p.trim()).filter(Boolean).join(', ')) {
        setSourcePropsString(currentString)
      }
    }
  }, [mergePropertiesConfig.sourceProperties])

  if (!actionNode) return null

  const handleSourcePropsChange = (value: string) => {
    setSourcePropsString(value)
    const props = value.split(',').map(p => p.trim()).filter(Boolean)
    const updated = { ...mergePropertiesConfig, sourceProperties: props }
    onMergePropertiesConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  const handleConfigChange = (key: keyof ActionConfigurationState['mergePropertiesConfig'], value: any) => {
    const updated = { ...mergePropertiesConfig, [key]: value }
    onMergePropertiesConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Merge Properties Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Properties</Label>
          <Input
            placeholder="prop1, prop2, prop3"
            className="h-8 text-xs"
            value={sourcePropsString}
            onChange={(e) => handleSourcePropsChange(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Comma-separated list of properties to merge.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="merged"
            className="h-8 text-xs"
            value={mergePropertiesConfig.targetProperty}
            onChange={(e) => handleConfigChange('targetProperty', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Merge Strategy</Label>
            <HelpTooltip content="How to merge the properties" />
          </div>
          <Select
            value={mergePropertiesConfig.mergeStrategy}
            onValueChange={(value) => handleConfigChange('mergeStrategy', value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concat">Concatenate (space-separated)</SelectItem>
              <SelectItem value="object">Object (key-value pairs)</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

