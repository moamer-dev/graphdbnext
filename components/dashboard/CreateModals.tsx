import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTeamCreate, useProjectCreate, useWorkspaceCreate } from '@/hooks/useCollaborativeCreate'
import { TeamFormView, ProjectFormView, WorkspaceFormView } from './CollaborativeForms'

interface CreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTeamDialog({ open, onOpenChange }: CreateModalProps) {
  const { form, onSubmit, isSubmitting } = useTeamCreate(() => onOpenChange(false))
  
  React.useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Organize your projects and members into a new collaborative team.
          </DialogDescription>
        </DialogHeader>
        <TeamFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}

export function CreateProjectDialog({ open, onOpenChange }: CreateModalProps) {
    const { form, onSubmit, isSubmitting } = useProjectCreate(() => onOpenChange(false))
  
    React.useEffect(() => {
      if (open) form.reset()
    }, [open, form])

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[650px] shadow-none border-2">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Start a new project within your current team.
            </DialogDescription>
          </DialogHeader>
          <ProjectFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>
    )
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateModalProps) {
    const { form, onSubmit, isSubmitting } = useWorkspaceCreate(() => onOpenChange(false))
  
    React.useEffect(() => {
      if (open) form.reset()
    }, [open, form])

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] shadow-none border-2">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Provision a specific co-working environment.
            </DialogDescription>
          </DialogHeader>
          <WorkspaceFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>
    )
}
