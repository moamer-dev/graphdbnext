'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/hooks/react-query'
import { 
  Loader2, 
  Layers, 
  Users, 
  Building2, 
  ArrowLeft, 
  Pencil, 
  Info, 
  UserPlus,
  ShieldCheck,
  Calendar,
  Mail,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditTeamDialog } from '@/components/dashboard/EditModals'

export default function TeamViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const { data, isLoading } = resourceHooks.teams.useSingle(id, !!id) as any
  const team = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Assemblying team organizational data</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Team not found</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back to management
        </Button>
      </div>
    )
  }

  // Calculate insights
  const projectsCount = team.projects?.length || 0
  const membersCount = team.members?.length || 0
  const invitationsCount = team.invitations?.length || 0

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
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{team.name}</h1>
              <Badge variant={team.isActive ? 'default' : 'secondary'} className="h-5 text-[10px] px-1.5 font-bold uppercase tracking-wider">
                {team.isActive ? 'Active Unit' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg mt-0.5 line-clamp-1">{team.description || 'Organizational structure without designated description.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Insights/Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            label="Managed Projects" 
            value={projectsCount} 
            icon={Layers} 
            color="text-blue-500" 
            bgColor="bg-blue-500/10" 
        />
        <StatCard 
            label="Verified Members" 
            value={membersCount} 
            icon={UserCheck} 
            color="text-emerald-500" 
            bgColor="bg-emerald-500/10" 
        />
        <StatCard 
            label="Pending Outreach" 
            value={invitationsCount} 
            icon={Mail} 
            color="text-amber-500" 
            bgColor="bg-amber-500/10" 
        />
        <StatCard 
            label="Organization Rank" 
            value={team.id.substring(0, 4).toUpperCase()} 
            icon={ShieldCheck} 
            color="text-indigo-500" 
            bgColor="bg-indigo-500/10" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Related Resources Tabs */}
        <div className="lg:col-span-2">
            <Tabs defaultValue="members" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-4 h-9">
                    <TabsTrigger value="members" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Members</TabsTrigger>
                    <TabsTrigger value="projects" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Projects</TabsTrigger>
                    <TabsTrigger value="invitations" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Invitations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="mt-0 space-y-3">
                    {team.members?.length > 0 ? (
                        team.members.map((m: any) => (
                            <ResourceItemCard 
                                key={m.id}
                                title={m.user.name || 'Anonymous Member'}
                                subtitle={m.isActive ? 'Active Access' : 'Suspended'}
                                description={m.user.email}
                                date={m.createdAt}
                                icon={Users}
                            />
                        ))
                    ) : (
                        <EmptyState message="No verified members found" />
                    )}
                </TabsContent>

                <TabsContent value="projects" className="mt-0 space-y-3">
                    {team.projects?.length > 0 ? (
                        team.projects.map((p: any) => (
                            <ResourceItemCard 
                                key={p.id}
                                title={p.name}
                                subtitle={p.isActive ? 'Active Asset' : 'Archived'}
                                description={p.description}
                                date={p.createdAt}
                                icon={Layers}
                                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                            />
                        ))
                    ) : (
                        <EmptyState message="Currently managing no projects" />
                    )}
                </TabsContent>

                <TabsContent value="invitations" className="mt-0 space-y-3">
                    {team.invitations?.length > 0 ? (
                        team.invitations.map((inv: any) => (
                            <ResourceItemCard 
                                key={inv.id}
                                title={inv.email}
                                subtitle={inv.status}
                                description={`Expires on ${new Date(inv.expiresAt).toLocaleDateString()}`}
                                date={inv.createdAt}
                                icon={Mail}
                            />
                        ))
                    ) : (
                        <EmptyState message="No pending invitations" />
                    )}
                </TabsContent>
            </Tabs>
        </div>

        {/* Right Column: Metadata Details */}
        <div className="space-y-6">
            <Card className="shadow-none bg-muted/5 border-muted-foreground/10">
                <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest">Organizational Blueprint</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                    <DetailItem 
                        label="Team ID" 
                        value={team.id} 
                        className="font-mono text-[10px]"
                    />
                    <DetailItem 
                        label="Account Owner" 
                        value={team.creator?.name || 'Platform Admin'}
                        subValue={team.creator?.email}
                    />
                    <DetailItem 
                        label="Formation Date" 
                        value={new Date(team.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })} 
                    />
                    <DetailItem 
                        label="Structural Update" 
                        value={new Date(team.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} 
                    />
                </CardContent>
            </Card>

            <Card className="shadow-none bg-indigo-[0.02] border-indigo-500/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-500/80">Management Insight</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                        This unit currently orchestrates {projectsCount} projects. 
                        Its workforce consists of {membersCount} active staff members and {invitationsCount} pending recruits.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>

      <EditTeamDialog 
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
