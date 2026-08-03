'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/hooks/react-query'
import { 
  Loader2, 
  Layers, 
  Users, 
  Briefcase, 
  ArrowLeft, 
  Pencil, 
  Info, 
  UserPlus,
  ShieldCheck,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditProjectDialog } from '@/components/dashboard/EditModals'

export default function ProjectViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const { data, isLoading } = resourceHooks.projects.useSingle(id, !!id) as any
  const project = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Reconstructing project assets</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back to repository
        </Button>
      </div>
    )
  }

  // Calculate insights
  const workspacesCount = project.workspaces?.length || 0
  const membersCount = project.team?.members?.length || 0
  const invitationsCount = project.team?.invitations?.length || 0

  return (
    <div className="space-y-6 mt-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full hover:bg-primary/5 group" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={project.isActive ? 'default' : 'secondary'} className="h-5 text-[10px] px-1.5 font-bold uppercase tracking-wider">
                {project.isActive ? 'Active' : 'Archived'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground line-clamp-1">{project.description || 'No specialized description provided for this project.'}</p>
                {project.team && (
                    <>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold uppercase text-primary/70">{project.team.name}</span>
                    </>
                )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Modify Asset
          </Button>
        </div>
      </div>

      {/* Insights/Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            label="Linked Workspaces" 
            value={workspacesCount} 
            icon={Briefcase} 
            color="text-blue-500" 
            bgColor="bg-blue-500/10" 
        />
        <StatCard 
            label="Team Context" 
            value={project.team ? 1 : 0} 
            icon={ShieldCheck} 
            color="text-emerald-500" 
            bgColor="bg-emerald-500/10" 
        />
        <StatCard 
            label="Active Members" 
            value={membersCount} 
            icon={Users} 
            color="text-indigo-500" 
            bgColor="bg-indigo-500/10" 
        />
        <StatCard 
            label="Pending Inbound" 
            value={invitationsCount} 
            icon={UserPlus} 
            color="text-rose-500" 
            bgColor="bg-rose-500/10" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Related Resources Tabs */}
        <div className="lg:col-span-2">
            <Tabs defaultValue="workspaces" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-4 h-9">
                    <TabsTrigger value="workspaces" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Workspaces</TabsTrigger>
                    <TabsTrigger value="members" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Team Members</TabsTrigger>
                </TabsList>
                
                <TabsContent value="workspaces" className="mt-0 space-y-3">
                    {project.workspaces?.length > 0 ? (
                        project.workspaces.map((pw: any) => (
                            <ResourceItemCard 
                                key={pw.workspace.id}
                                title={pw.workspace.name}
                                subtitle={pw.workspace.isActive ? 'Active Environment' : 'Isolated'}
                                description={pw.workspace.description}
                                date={pw.workspace.createdAt}
                                icon={Briefcase}
                                onClick={() => router.push(`/dashboard/workspaces/${pw.workspace.id}`)}
                            />
                        ))
                    ) : (
                        <EmptyState message="Project not assigned to any workspace" />
                    )}
                </TabsContent>

                <TabsContent value="members" className="mt-0 space-y-3">
                    {project.team?.members?.length > 0 ? (
                        project.team.members.map((m: any) => (
                            <ResourceItemCard 
                                key={m.id}
                                title={m.user.name || 'Anonymous User'}
                                subtitle={m.isActive ? 'Verified Collaborator' : 'Inactive'}
                                description={m.user.email}
                                date={m.createdAt}
                                icon={Users}
                            />
                        ))
                    ) : (
                        <EmptyState message="No verified team members" />
                    )}
                    {project.team?.invitations?.length > 0 && (
                         <div className="pt-4 mt-4 border-t border-border/40">
                             <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-3 ml-1">Pending Invitations</h4>
                             <div className="space-y-3">
                                {project.team.invitations.map((inv: any) => (
                                    <ResourceItemCard 
                                        key={inv.id}
                                        title={inv.email}
                                        subtitle="Awaiting Acceptance"
                                        description={`Invited on ${new Date(inv.createdAt).toLocaleDateString()}`}
                                        date={inv.createdAt}
                                        icon={UserPlus}
                                    />
                                ))}
                             </div>
                         </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>

        {/* Right Column: Metadata Details */}
        <div className="space-y-6">
            <Card className="shadow-none bg-muted/5 border-muted-foreground/10">
                <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest">Digital Asset Metadata</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                    <DetailItem 
                        label="Asset Identifier" 
                        value={project.id} 
                        className="font-mono text-[10px]"
                    />
                    <DetailItem 
                        label="Governance Model" 
                        value={project.team ? 'Team-Scoped RBAC' : 'Personal Visibility'} 
                    />
                    <DetailItem 
                        label="Primary Architect" 
                        value={project.creator?.name || 'System'}
                        subValue={project.creator?.email}
                    />
                    <DetailItem 
                        label="Initialization Date" 
                        value={new Date(project.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })} 
                    />
                    <DetailItem 
                        label="Last Modification" 
                        value={new Date(project.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} 
                    />
                </CardContent>
            </Card>

            {project.team && (
                <Card className="shadow-none bg-primary/[0.02] border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/80">Organizational Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                            This project is integrated into the <strong>{project.team.name}</strong> organizational unit. 
                            It serves as a collaborative core for {membersCount} active stakeholders and {invitationsCount} prospective members.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      <EditProjectDialog 
        id={id} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="shadow-none border-border/40 bg-card/40 hover:bg-card transition-colors overflow-hidden relative group">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">{label}</p>
                        <h3 className="text-2xl font-bold tracking-tighter">{value}</h3>
                    </div>
                    <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500" />
            </CardContent>
        </Card>
    )
}

function ResourceItemCard({ title, subtitle, description, date, icon: Icon, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer group`}
        >
            <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{title}</h4>
                    <span className="text-[10px] text-muted-foreground/40 font-medium whitespace-nowrap">{new Date(date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">{subtitle}</span>
                    <div className="h-1 w-1 rounded-full bg-border" />
                    <p className="text-[10px] text-muted-foreground/50 truncate max-w-md italic">{description || 'No additional metadata attached.'}</p>
                </div>
            </div>
        </div>
    )
}

function DetailItem({ label, value, subValue, className }: any) {
    return (
        <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{label}</span>
            <div className="flex flex-col">
                <span className={`text-xs font-semibold tracking-tight ${className}`}>{value || '-'}</span>
                {subValue && <span className="text-[10px] text-muted-foreground/60">{subValue}</span>}
            </div>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-muted/5 border-border/40">
            <p className="text-[11px] font-medium text-muted-foreground/50 italic">{message}</p>
        </div>
    )
}
