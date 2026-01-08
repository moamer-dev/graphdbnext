'use client'

import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionExtractXmlContentConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  extractXmlContentConfig: ActionConfigurationState['extractXmlContentConfig']
  onExtractXmlContentConfigChange: (config: ActionConfigurationState['extractXmlContentConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionExtractXmlContentConfiguration({
  actionNodeId,
  actionNode,
  extractXmlContentConfig,
  onExtractXmlContentConfigChange,
  onUpdateActionNode
}: ActionExtractXmlContentConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Extract XML Content Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={extractXmlContentConfig.includeAttributes}
            onChange={(e) => {
              const updated = { ...extractXmlContentConfig, includeAttributes: e.target.checked }
              onExtractXmlContentConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, includeAttributes: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Include Attributes</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={extractXmlContentConfig.includeChildren}
            onChange={(e) => {
              const updated = { ...extractXmlContentConfig, includeChildren: e.target.checked }
              onExtractXmlContentConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, includeChildren: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Include Children</Label>
        </div>
      </div>
    </CollapsibleSection>
  )
}

