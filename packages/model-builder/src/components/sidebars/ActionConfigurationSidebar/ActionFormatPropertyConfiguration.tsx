'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionFormatPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionFormatPropertyConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionFormatPropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Format Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="e.g., date, amount"
            className="h-8 text-xs"
            value={(actionNode.config.propertyKey as string) || ''}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, propertyKey: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Format</Label>
            <HelpTooltip content="Select the format type" />
          </div>
          <Select
            value={(actionNode.config.format as string) || 'text'}
            onValueChange={(value) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, format: value }
              })
            }}
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
            placeholder="e.g., USD for currency, date format"
            className="h-8 text-xs"
            value={(actionNode.config.formatString as string) || ''}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, formatString: e.target.value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

