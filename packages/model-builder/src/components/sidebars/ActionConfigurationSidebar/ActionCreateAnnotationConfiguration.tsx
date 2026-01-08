'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateAnnotationConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createAnnotationConfig: ActionConfigurationState['createAnnotationConfig']
  onCreateAnnotationConfigChange: (config: ActionConfigurationState['createAnnotationConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateAnnotationConfiguration({
  actionNodeId,
  actionNode,
  createAnnotationConfig,
  onCreateAnnotationConfigChange,
  onUpdateActionNode
}: ActionCreateAnnotationConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Annotation Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Annotation Types</Label>
          <Input
            placeholder="Enter annotation types (comma-separated)"
            className="h-8 text-xs"
            value={createAnnotationConfig.annotationTypes.join(', ')}
            onChange={(e) => {
              const annotationTypes = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...createAnnotationConfig, annotationTypes }
              onCreateAnnotationConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, annotationTypes }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

