'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Loader2, Save, Upload } from 'lucide-react'
import { toast } from '../../utils/toast'
import type { WorkflowPersistence } from '../ModelBuilder'
import type { WorkflowConfigExport } from '../../utils/workflowConfigExport'

interface WorkflowManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowPersistence: WorkflowPersistence
  currentWorkflowConfig: WorkflowConfigExport | null
  onLoadWorkflowConfig: (config: WorkflowConfigExport) => void
}

export function WorkflowManagementDialog({
  open,
  onOpenChange,
  workflowPersistence,
  currentWorkflowConfig,
  onLoadWorkflowConfig
}: WorkflowManagementDialogProps) {
  const [workflows, setWorkflows] = useState<Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

  const { modelId, onSaveWorkflow, onUpdateWorkflow, onLoadWorkflows, onLoadWorkflow } = workflowPersistence

  useEffect(() => {
    if (open && modelId && onLoadWorkflows) {
      loadWorkflows()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modelId, onLoadWorkflows])

  const loadWorkflows = async () => {
    if (!modelId || !onLoadWorkflows) return
    
    setLoading(true)
    try {
      const data = await onLoadWorkflows(modelId)
      setWorkflows(data)
    } catch (error) {
      toast.error('Failed to load workflows')
      console.error('Error loading workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWorkflow = async () => {
    if (!currentWorkflowConfig || !workflowName.trim() || !onSaveWorkflow) return

    setSaving(true)
    try {
      await onSaveWorkflow({
        name: workflowName.trim(),
        description: workflowDescription.trim() || undefined,
        config: currentWorkflowConfig
      })
      toast.success('Workflow saved successfully')
      setWorkflowName('')
      setWorkflowDescription('')
      await loadWorkflows()
    } catch (error) {
      toast.error('Failed to save workflow')
      console.error('Error saving workflow:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateWorkflow = async () => {
    if (!selectedWorkflowId || !onUpdateWorkflow || !currentWorkflowConfig) return

    setSaving(true)
    try {
      await onUpdateWorkflow(selectedWorkflowId, {
        name: workflowName.trim() || undefined,
        description: workflowDescription.trim() || undefined,
        config: currentWorkflowConfig
      })
      toast.success('Workflow updated successfully')
      setWorkflowName('')
      setWorkflowDescription('')
      setSelectedWorkflowId(null)
      await loadWorkflows()
    } catch (error) {
      toast.error('Failed to update workflow')
      console.error('Error updating workflow:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLoadWorkflow = async (id: string) => {
    if (!onLoadWorkflow) return

    setLoading(true)
    try {
      const workflow = await onLoadWorkflow(id)
      if (workflow.config) {
        onLoadWorkflowConfig(workflow.config as WorkflowConfigExport)
        toast.success(`Workflow "${workflow.name}" loaded`)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Failed to load workflow')
      console.error('Error loading workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWorkflow = (workflow: typeof workflows[0]) => {
    setSelectedWorkflowId(workflow.id)
    setWorkflowName(workflow.name)
    setWorkflowDescription(workflow.description || '')
  }

  const canSave = currentWorkflowConfig && workflowName.trim() && !saving
  const canUpdate = selectedWorkflowId && currentWorkflowConfig && !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Workflows</DialogTitle>
          <DialogDescription>
            Save, load, and manage workflows for this model
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Enter workflow description"
                rows={3}
                disabled={saving}
              />
            </div>
            <div className="flex gap-2">
              {selectedWorkflowId ? (
                <>
                  <Button
                    onClick={handleUpdateWorkflow}
                    disabled={!canUpdate}
                    size="sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Workflow
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkflowId(null)
                      setWorkflowName('')
                      setWorkflowDescription('')
                    }}
                    size="sm"
                  >
                    New Workflow
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSaveWorkflow}
                  disabled={!canSave}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Workflow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label>Saved Workflows</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadWorkflows}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No saved workflows yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedWorkflowId === workflow.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectWorkflow(workflow)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {workflow.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadWorkflow(workflow.id)
                          }}
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

