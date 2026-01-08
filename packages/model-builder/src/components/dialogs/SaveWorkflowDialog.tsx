'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Loader2, Save } from 'lucide-react'
import { toast } from '../../utils/toast'
import type { WorkflowPersistence } from '../ModelBuilder'
import type { WorkflowConfigExport } from '../../utils/workflowConfigExport'

interface SaveWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowPersistence: WorkflowPersistence | undefined
  currentWorkflowConfig: WorkflowConfigExport | null
  existingWorkflows?: Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>
  isNewModel: boolean
  onSave: (workflowAction: {
    action: 'skip' | 'create' | 'update'
    workflowId?: string
    name?: string
    description?: string
  }) => Promise<void>
}

export function SaveWorkflowDialog({
  open,
  onOpenChange,
  workflowPersistence,
  currentWorkflowConfig,
  existingWorkflows = [],
  isNewModel,
  onSave
}: SaveWorkflowDialogProps) {
  const [saveWorkflow, setSaveWorkflow] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [action, setAction] = useState<'create' | 'update'>('create')
  const [saving, setSaving] = useState(false)
  const [hasWorkflow, setHasWorkflow] = useState(false)

  // Check if there's a workflow to save
  useEffect(() => {
    if (open && currentWorkflowConfig) {
      const hasTools = currentWorkflowConfig.tools && currentWorkflowConfig.tools.length > 0
      const hasActions = currentWorkflowConfig.actions && currentWorkflowConfig.actions.length > 0
      setHasWorkflow(hasTools || hasActions)
      
      // For editing: if there are existing workflows, default to update the first one
      if (!isNewModel && existingWorkflows.length > 0) {
        const firstWorkflow = existingWorkflows[0]
        setSelectedWorkflowId(firstWorkflow.id)
        setWorkflowName(firstWorkflow.name)
        setWorkflowDescription(firstWorkflow.description || '')
        setAction('update')
        setSaveWorkflow(true)
      } else {
        setSaveWorkflow(false)
        setWorkflowName('')
        setWorkflowDescription('')
        setSelectedWorkflowId(null)
        setAction('create')
      }
    }
  }, [open, currentWorkflowConfig, existingWorkflows, isNewModel])

  const handleSave = async () => {
    if (!currentWorkflowConfig) {
      await onSave({ action: 'skip' })
      return
    }

    if (!saveWorkflow || !hasWorkflow) {
      await onSave({ action: 'skip' })
      return
    }

    // For new models, workflowPersistence might be undefined, but we can still save
    // The adapter will handle saving the workflow after model creation
    if (isNewModel && !workflowPersistence) {
      if (!workflowName.trim()) {
        toast.error('Workflow name is required')
        return
      }
      setSaving(true)
      try {
        await onSave({
          action: 'create',
          name: workflowName.trim(),
          description: workflowDescription.trim() || undefined
        })
        onOpenChange(false)
      } catch (error) {
        console.error('Error saving workflow:', error)
        toast.error('Failed to save workflow')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!workflowPersistence) {
      await onSave({ action: 'skip' })
      return
    }

    if (action === 'create') {
      if (!workflowName.trim()) {
        toast.error('Workflow name is required')
        return
      }
    } else if (action === 'update') {
      if (!selectedWorkflowId) {
        toast.error('Please select a workflow to update')
        return
      }
    }

    setSaving(true)
    try {
      await onSave({
        action: saveWorkflow ? (action === 'update' ? 'update' : 'create') : 'skip',
        workflowId: action === 'update' ? selectedWorkflowId || undefined : undefined,
        name: workflowName.trim() || undefined,
        description: workflowDescription.trim() || undefined
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast.error('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    onSave({ action: 'skip' })
  }

  // Auto-skip if no workflow when dialog opens (only after we've checked)
  useEffect(() => {
    if (open && currentWorkflowConfig) {
      // Wait a bit to ensure hasWorkflow state is updated
      const timer = setTimeout(() => {
        const hasTools = currentWorkflowConfig.tools && currentWorkflowConfig.tools.length > 0
        const hasActions = currentWorkflowConfig.actions && currentWorkflowConfig.actions.length > 0
        if (!hasTools && !hasActions && !hasWorkflow) {
          onSave({ action: 'skip' })
          onOpenChange(false)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, hasWorkflow, currentWorkflowConfig, onSave, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNewModel ? 'Save Workflow?' : 'Update Workflow?'}
          </DialogTitle>
          <DialogDescription>
            {isNewModel
              ? 'Would you like to save the workflow you created along with this model?'
              : 'Would you like to save the changes to your workflow?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-workflow"
              checked={saveWorkflow}
              onCheckedChange={(checked) => setSaveWorkflow(checked === true)}
              disabled={saving}
            />
            <Label
              htmlFor="save-workflow"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {isNewModel ? 'Save workflow with this model' : 'Save workflow changes'}
            </Label>
          </div>

          {saveWorkflow && (
            <div className="space-y-4 pl-6 border-l-2">
              {!isNewModel && existingWorkflows.length > 0 && (
                <div className="space-y-2">
                  <Label>Update existing workflow or create new?</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="update-existing"
                        name="workflow-action"
                        checked={action === 'update'}
                        onChange={() => setAction('update')}
                        disabled={saving}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="update-existing" className="text-sm">
                        Update existing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="create-new"
                        name="workflow-action"
                        checked={action === 'create'}
                        onChange={() => setAction('create')}
                        disabled={saving}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="create-new" className="text-sm">
                        Create new
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {action === 'update' && existingWorkflows.length > 0 && (
                <div className="space-y-2">
                  <Label>Select workflow to update</Label>
                  <select
                    value={selectedWorkflowId || ''}
                    onChange={(e) => {
                      const workflowId = e.target.value
                      setSelectedWorkflowId(workflowId)
                      const workflow = existingWorkflows.find(w => w.id === workflowId)
                      if (workflow) {
                        setWorkflowName(workflow.name)
                        setWorkflowDescription(workflow.description || '')
                      }
                    }}
                    disabled={saving}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {existingWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="workflow-name">
                  Workflow Name {action === 'create' && '*'}
                </Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                  disabled={saving || (action === 'update' && existingWorkflows.length > 0)}
                  required={action === 'create'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description (Optional)</Label>
                <Textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Enter workflow description"
                  rows={3}
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            {saveWorkflow ? 'Skip' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (saveWorkflow && action === 'create' && !workflowName.trim() && hasWorkflow)}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNewModel ? 'Create Model' : 'Save Changes'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

