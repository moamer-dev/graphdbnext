import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTeamUpdate, useProjectUpdate, useWorkspaceUpdate } from '@/hooks/useCollaborativeCreate'
import { TeamFormView, ProjectFormView, WorkspaceFormView } from './CollaborativeForms'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface EditModalProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTeamDialog({ id, open, onOpenChange }: EditModalProps) {
  const { form, onSubmit, isSubmitting, isLoadingData } = useTeamUpdate(id, () => onOpenChange(false))
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update your team details and settings.
          </DialogDescription>
        </DialogHeader>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TeamFormView 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={isSubmitting} 
            submitLabel="Save Changes" 
            isAdmin={isAdmin}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EditProjectDialog({ id, open, onOpenChange }: EditModalProps) {
  const { form, onSubmit, isSubmitting, isLoadingData } = useProjectUpdate(id, () => onOpenChange(false))
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Modify project information and scope.
          </DialogDescription>
        </DialogHeader>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ProjectFormView 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={isSubmitting} 
            submitLabel="Save Changes" 
            isAdmin={isAdmin}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EditWorkspaceDialog({ id, open, onOpenChange }: EditModalProps) {
  const { form, onSubmit, isSubmitting, isLoadingData } = useWorkspaceUpdate(id, () => onOpenChange(false))
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
          <DialogDescription>
            Adjust workspace configurations and description.
          </DialogDescription>
        </DialogHeader>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <WorkspaceFormView 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={isSubmitting} 
            submitLabel="Save Changes" 
            isAdmin={isAdmin}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
