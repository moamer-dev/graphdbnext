'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Button } from '../../ui/button'
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateAnnotationNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createAnnotationNodesConfig: ActionConfigurationState['createAnnotationNodesConfig']
  onCreateAnnotationNodesConfigChange: (config: ActionConfigurationState['createAnnotationNodesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateAnnotationNodesConfiguration({
  actionNodeId,
  actionNode,
  createAnnotationNodesConfig,
  onCreateAnnotationNodesConfigChange,
  onUpdateActionNode
}: ActionCreateAnnotationNodesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Annotation Nodes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates annotation nodes from attributes (common in TEI/XML documents).
          </p>
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded space-y-2">
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Reference Linking
            </h4>
            <p className="text-[10px] text-blue-800 dark:text-blue-200">
              Create a direct relationship to another node referenced by an ID in an attribute.
            </p>

            <div className="space-y-2 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Attribute Name</Label>
                <Input
                  placeholder="e.g. target, ref, corresp"
                  className="h-8 text-xs bg-background"
                  value={createAnnotationNodesConfig.referenceAttribute || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const updated = { ...createAnnotationNodesConfig, referenceAttribute: value }
                    onCreateAnnotationNodesConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, referenceAttribute: value }
                    })
                  }}
                />
                <p className="text-[10px] text-muted-foreground">The XML attribute containing the reference ID (e.g. "#word-1")</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Relationship Label</Label>
                <Input
                  placeholder="e.g. annotates, refersTo"
                  className="h-8 text-xs bg-background"
                  value={createAnnotationNodesConfig.relationshipType}
                  onChange={(e) => {
                    const value = e.target.value
                    const updated = { ...createAnnotationNodesConfig, relationshipType: value }
                    onCreateAnnotationNodesConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, relationshipType: value }
                    })
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
