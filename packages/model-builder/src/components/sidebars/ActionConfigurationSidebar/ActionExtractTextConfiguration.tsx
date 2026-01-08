'use client'

import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionExtractTextConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  extractTextConfig: ActionConfigurationState['extractTextConfig']
  onExtractTextConfigChange: (config: ActionConfigurationState['extractTextConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionExtractTextConfiguration({
  actionNodeId,
  actionNode,
  extractTextConfig,
  onExtractTextConfigChange,
  onUpdateActionNode
}: ActionExtractTextConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Extract Text Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Extraction Mode</Label>
          <Select
            value={extractTextConfig.extractionMode}
            onValueChange={(value) => {
              const updated = { ...extractTextConfig, extractionMode: value as 'text' | 'tail' | 'xmlContent' }
              onExtractTextConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, extractionMode: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Content</SelectItem>
              <SelectItem value="tail">Tail Content</SelectItem>
              <SelectItem value="xmlContent">Full XML Content</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

