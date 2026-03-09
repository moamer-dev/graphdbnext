import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionFormatPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  formatPropertyConfig: ActionConfigurationState['formatPropertyConfig']
  onFormatPropertyConfigChange: (config: ActionConfigurationState['formatPropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionFormatPropertyConfiguration({
  actionNodeId,
  actionNode,
  formatPropertyConfig,
  onFormatPropertyConfigChange,
  onUpdateActionNode
}: ActionFormatPropertyConfigurationProps) {
  if (!actionNode) return null

  const handleConfigChange = (key: keyof ActionConfigurationState['formatPropertyConfig'], value: any) => {
    const updated = { ...formatPropertyConfig, [key]: value }
    onFormatPropertyConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Format Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="e.g., date, amount"
            className="h-8 text-xs"
            value={formatPropertyConfig.propertyKey}
            onChange={(e) => handleConfigChange('propertyKey', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Format</Label>
            <HelpTooltip content="Select the format type" />
          </div>
          <Select
            value={formatPropertyConfig.format}
            onValueChange={(value) => handleConfigChange('format', value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="currency">Currency</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Format String (optional)</Label>
          <Input
            placeholder="e.g., en-US for locale, USD for currency"
            className="h-8 text-xs"
            value={formatPropertyConfig.formatString}
            onChange={(e) => handleConfigChange('formatString', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
      </div>
    </CollapsibleSection>
  )
}

