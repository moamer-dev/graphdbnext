import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resourceHooks } from '@/hooks/react-query'
import { Loader2, Calendar, Info, Layers, Users, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ViewModalProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: any }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{title}</h3>
        </div>
    )
}

function DetailRow({ label, value, fullWidth = false }: { label: string; value: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div className={`flex flex-col space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-tighter">{label}</span>
            <div className="text-sm font-medium pr-4 break-words leading-snug">
                {value || <span className="text-muted-foreground/30 italic font-normal">None</span>}
            </div>
        </div>
    )
}

export function ViewTeamDialog({ id, open, onOpenChange }: ViewModalProps) {
  const [stableId, setStableId] = React.useState(id)
  
  React.useEffect(() => {
     if (open && id) setStableId(id)
  }, [open, id])

  const { data, isLoading } = resourceHooks.teams.useSingle(stableId, !!stableId) as any
  const team = data?.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
             <Users className="h-6 w-6 text-primary" />
             <div>
                <DialogTitle className="text-lg">Team Details</DialogTitle>
                <DialogDescription className="text-xs">Organizational structure overview</DialogDescription>
             </div>
          </div>
        </DialogHeader>
        
        {isLoading && !team ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Fetching data</p>
          </div>
        ) : team ? (
          <div className="space-y-10 py-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 px-2">
               <div className="col-span-full">
                  <SectionTitle title="Identity" icon={Info} />
               </div>
               <DetailRow label="Name" value={team.name} />
               <DetailRow 
                   label="Status" 
                   value={
                       <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${team.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           <span className={`text-xs font-semibold ${team.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {team.isActive ? 'Active' : 'Inactive'}
                           </span>
                       </div>
                   } 
               />
               <DetailRow label="Description" value={team.description} fullWidth />
               <DetailRow label="Created On" value={new Date(team.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })} />
               <DetailRow 
                   label="Created By" 
                   value={
                       <div className="flex flex-col">
                           <span>{team.creator?.name || 'System'}</span>
                           <span className="text-[10px] text-muted-foreground font-normal">{team.creator?.email}</span>
                       </div>
                   } 
               />
            </div>

            <div className="px-2">
               <SectionTitle title="Projects" icon={Layers} />
               <div className="flex flex-wrap gap-2 mt-4">
                  {team.projects && team.projects.length > 0 ? (
                      team.projects.map((p: any) => (
                        <Badge key={p.id} variant="secondary" className="px-3 py-1 bg-muted/30 text-muted-foreground border-0 font-normal">
                             {p.name}
                        </Badge>
                      ))
                  ) : (
                      <span className="text-xs text-muted-foreground/50 italic font-normal px-1">No assigned projects</span>
                  )}
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function ViewProjectDialog({ id, open, onOpenChange }: ViewModalProps) {
  const [stableId, setStableId] = React.useState(id)
  
  React.useEffect(() => {
     if (open && id) setStableId(id)
  }, [open, id])

  const { data, isLoading } = resourceHooks.projects.useSingle(stableId, !!stableId) as any
  const project = data?.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
             <Layers className="h-6 w-6 text-primary" />
             <div>
                <DialogTitle className="text-lg">Project Details</DialogTitle>
                <DialogDescription className="text-xs">Strategic asset definition</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        {isLoading && !project ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Loading profile</p>
          </div>
        ) : project ? (
          <div className="space-y-10 py-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 px-2">
               <div className="col-span-full">
                  <SectionTitle title="Information" icon={Info} />
               </div>
               <DetailRow label="Label" value={project.name} />
               <DetailRow 
                   label="Status" 
                   value={
                       <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${project.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           <span className={`text-xs font-semibold ${project.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {project.isActive ? 'Active' : 'Archived'}
                           </span>
                       </div>
                   } 
               />
               <DetailRow label="Description" value={project.description} fullWidth />
               <DetailRow label="Owner" value={project.team?.name || 'Standard'} />
               <DetailRow 
                   label="Created By" 
                   value={
                       <div className="flex flex-col">
                           <span>{project.creator?.name || 'System'}</span>
                           <span className="text-[10px] text-muted-foreground font-normal">{project.creator?.email}</span>
                       </div>
                   } 
               />
            </div>

            <div className="px-2">
               <SectionTitle title="Workspaces" icon={Briefcase} />
               <div className="flex flex-wrap gap-2 mt-4">
                  {project.workspaces && project.workspaces.length > 0 ? (
                      project.workspaces.map((pw: any) => (
                        <Badge key={pw.workspace.id} variant="secondary" className="px-3 py-1 bg-muted/30 text-muted-foreground border-0 font-normal">
                             {pw.workspace.name}
                        </Badge>
                      ))
                  ) : (
                      <span className="text-xs text-muted-foreground/50 italic font-normal px-1">Unlinked to workspaces</span>
                  )}
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function ViewWorkspaceDialog({ id, open, onOpenChange }: ViewModalProps) {
  const [stableId, setStableId] = React.useState(id)
  
  React.useEffect(() => {
     if (open && id) setStableId(id)
  }, [open, id])

  const { data, isLoading } = resourceHooks.workspaces.useSingle(stableId, !!stableId) as any
  const workspace = data?.data
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
             <Briefcase className="h-6 w-6 text-primary" />
             <div>
                <DialogTitle className="text-lg">Workspace View</DialogTitle>
                <DialogDescription className="text-xs">Runtime environment context</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        {isLoading && !workspace ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Fetching assets</p>
          </div>
        ) : workspace ? (
          <div className="space-y-10 py-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 px-2">
               <div className="col-span-full">
                  <SectionTitle title="Context" icon={Info} />
               </div>
               <DetailRow label="Designation" value={workspace.name} />
               <DetailRow 
                   label="Availability" 
                   value={
                       <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${workspace.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           <span className={`text-xs font-semibold ${workspace.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {workspace.isActive ? 'Online' : 'Offline'}
                           </span>
                       </div>
                   } 
               />
               <DetailRow label="Configuration" value={workspace.description} fullWidth />
               <DetailRow label="Provisioned" value={new Date(workspace.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })} />
               <DetailRow 
                   label="Created By" 
                   value={
                       <div className="flex flex-col">
                           <span>{workspace.creator?.name || 'System'}</span>
                           <span className="text-[10px] text-muted-foreground font-normal">{workspace.creator?.email}</span>
                       </div>
                   } 
               />
            </div>

            <div className="px-2">
               <SectionTitle title="Usage" icon={Layers} />
               <div className="flex flex-wrap gap-2 mt-4">
                  {workspace.projects && workspace.projects.length > 0 ? (
                      workspace.projects.map((pw: any) => (
                        <Badge key={pw.project.id} variant="secondary" className="px-3 py-1 bg-muted/30 text-muted-foreground border-0 font-normal">
                             {pw.project.name}
                        </Badge>
                      ))
                  ) : (
                      <span className="text-xs text-muted-foreground/50 italic font-normal px-1">Currently unused</span>
                  )}
               </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
