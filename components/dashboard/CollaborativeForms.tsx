import React from 'react'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resourceHooks } from '@/hooks/react-query'
import { Badge } from '@/components/ui/badge'
import { X, Loader2 } from 'lucide-react'

interface BaseFormProps {
  form: UseFormReturn<any>
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
  submitLabel?: string
  isAdmin?: boolean
}

export function TeamFormView({ form, onSubmit, isSubmitting, submitLabel = 'Create Team', isAdmin }: BaseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-6 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Engineering, Marketing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What is this team about?" 
                  className="min-h-[100px] resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-3 py-2 border-t pt-4">
              <div className={`h-2.5 w-2.5 rounded-full ${field.value ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <FormLabel className="flex-1 text-sm font-medium cursor-pointer">
                {field.value ? 'Active' : 'Inactive'} Status
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          )}
        />

        {isAdmin && <CreatorSelector form={form} />}

        <TeamProjectAssignment form={form} />

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving changes...' : submitLabel}
        </Button>
      </div>
      </form>
    </Form>
  )
}


function CreatorSelector({ form }: { form: UseFormReturn<any> }) {
  const { data: usersData, isLoading } = resourceHooks.users.useList({ page: 1, pageSize: 100 }) as any
  const users = usersData?.data || []
  const currentCreatorId = form.watch('creatorId')

  return (
    <div className="space-y-3 p-4 rounded-lg border-2 border-dashed border-muted bg-muted/10">
      <div className="flex items-center justify-between">
        <FormLabel className="text-[10px] font-bold text-primary uppercase tracking-widest">Ownership (Admin Only)</FormLabel>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      
      <FormField
        control={form.control}
        name="creatorId"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Select new owner..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">{user.name || user.email}</span>
                        <span className="text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <p className="text-[10px] text-muted-foreground italic leading-tight">
        Reassigning the creator will change who has primary ownership rights over this resource.
      </p>
    </div>
  )
}

function TeamProjectAssignment({ form }: { form: UseFormReturn<any> }) {
  const { data: projectsData, isLoading } = resourceHooks.projects.useList({ page: 1, pageSize: 100 }) as any
  const projects = projectsData?.data || []
  const selectedIds = form.watch('projectIds') || []

  const toggleProject = (id: string) => {
    const current = new Set(selectedIds)
    if (current.has(id)) {
      current.delete(id)
    } else {
      current.add(id)
    }
    form.setValue('projectIds', Array.from(current))
  }

  const unselectedProjects = projects.filter((p: any) => !selectedIds.includes(p.id))

  return (
    <div className="space-y-3">
      <FormLabel className="text-muted-foreground/80 font-semibold tracking-tight uppercase text-[10px]">Assigned Projects</FormLabel>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 rounded-lg border bg-muted/30">
        {selectedIds.map((id: string) => {
          const project = projects.find((p: any) => p.id === id)
          return (
            <Badge key={id} variant="secondary" className="gap-1 pr-1.5 py-1.5 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
              <span className="max-w-[200px] truncate">{project?.name || id}</span>
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleProject(id)
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          )
        })}
        {selectedIds.length === 0 && <span className="text-xs text-muted-foreground/60 italic self-center px-1">Initial state: No projects assigned</span>}
      </div>

      {isLoading ? (
        <div className="h-10 w-full rounded-lg bg-muted/20 animate-pulse flex items-center px-3 gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-dashed text-xs text-muted-foreground bg-muted/10">
          No projects created. Go to Projects page to create one.
        </div>
      ) : unselectedProjects.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-xs font-medium">
          ✓ All available projects are already assigned to this team.
        </div>
      ) : (
        <Select onValueChange={(val) => toggleProject(val)} value="">
          <SelectTrigger className="w-full h-10 transition-all hover:border-primary/50 focus:ring-1 focus:ring-primary">
            <SelectValue placeholder="Add another project to this team..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedProjects.map((p: any) => (
              <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{p.name}</span>
                  {p.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export function ProjectFormView({ form, onSubmit, isSubmitting, submitLabel = 'Create Project', isAdmin }: BaseFormProps) {
    return (
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-6 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Q1 Roadmap, Graph Redesign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Project goals and scope..." 
                  className="min-h-[100px] resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-3 py-2 border-t pt-4">
              <div className={`h-2.5 w-2.5 rounded-full ${field.value ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <FormLabel className="flex-1 text-sm font-medium cursor-pointer">
                {field.value ? 'Active' : 'Inactive'} Status
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          )}
        />

        {isAdmin && <CreatorSelector form={form} />}
        
        <ProjectWorkspaceAssignment form={form} />

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving changes...' : submitLabel}
        </Button>
      </div>
        </form>
      </Form>
    )
}

function ProjectWorkspaceAssignment({ form }: { form: UseFormReturn<any> }) {
  const { data: workspacesData, isLoading } = resourceHooks.workspaces.useList({ page: 1, pageSize: 100 }) as any
  const workspaces = workspacesData?.data || []
  const selectedIds = form.watch('workspaceIds') || []

  const toggleWorkspace = (id: string) => {
    const current = new Set(selectedIds)
    if (current.has(id)) {
      current.delete(id)
    } else {
      current.add(id)
    }
    form.setValue('workspaceIds', Array.from(current))
  }

  const unselectedWorkspaces = workspaces.filter((w: any) => !selectedIds.includes(w.id))

  return (
    <div className="space-y-3">
      <FormLabel className="text-muted-foreground/80 font-semibold tracking-tight uppercase text-[10px]">Assigned Workspaces</FormLabel>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 rounded-lg border bg-muted/30">
        {selectedIds.map((id: string) => {
          const workspace = workspaces.find((w: any) => w.id === id)
          return (
            <Badge key={id} variant="secondary" className="gap-1 pr-1.5 py-1.5 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
              <span className="max-w-[200px] truncate">{workspace?.name || id}</span>
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleWorkspace(id)
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          )
        })}
        {selectedIds.length === 0 && <span className="text-xs text-muted-foreground/60 italic self-center px-1">Initial state: No workspaces assigned</span>}
      </div>

      {isLoading ? (
        <div className="h-10 w-full rounded-lg bg-muted/20 animate-pulse flex items-center px-3 gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">Loading workspaces...</span>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-dashed text-xs text-muted-foreground bg-muted/10">
          No workspaces created. Go to Workspaces page to create one.
        </div>
      ) : unselectedWorkspaces.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-xs font-medium">
          ✓ All available workspaces are already assigned to this project.
        </div>
      ) : (
        <Select onValueChange={(val) => toggleWorkspace(val)} value="">
          <SelectTrigger className="w-full h-10 transition-all hover:border-primary/50 focus:ring-1 focus:ring-primary">
            <SelectValue placeholder="Add another workspace to this project..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedWorkspaces.map((w: any) => (
              <SelectItem key={w.id} value={w.id} className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{w.name}</span>
                  {w.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{w.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export function WorkspaceFormView({ form, onSubmit, isSubmitting, submitLabel = 'Create Workspace', isAdmin }: BaseFormProps) {
    return (
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-6 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Staging, Production" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Specific environment details..." 
                  className="min-h-[100px] resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-3 py-2 border-t pt-4">
              <div className={`h-2.5 w-2.5 rounded-full ${field.value ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <FormLabel className="flex-1 text-sm font-medium cursor-pointer">
                {field.value ? 'Active' : 'Inactive'} Status
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          )}
        />

        {isAdmin && <CreatorSelector form={form} />}

        <WorkspaceProjectAssignment form={form} />

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving changes...' : submitLabel}
        </Button>
      </div>
        </form>
      </Form>
    )
}

function WorkspaceProjectAssignment({ form }: { form: UseFormReturn<any> }) {
  const { data: projectsData, isLoading } = resourceHooks.projects.useList({ page: 1, pageSize: 100 }) as any
  const projects = projectsData?.data || []
  const selectedIds = form.watch('projectIds') || []

  const toggleProject = (id: string) => {
    const current = new Set(selectedIds)
    if (current.has(id)) {
      current.delete(id)
    } else {
      current.add(id)
    }
    form.setValue('projectIds', Array.from(current))
  }

  const unselectedProjects = projects.filter((p: any) => !selectedIds.includes(p.id))

  return (
    <div className="space-y-3">
      <FormLabel className="text-muted-foreground/80 font-semibold tracking-tight uppercase text-[10px]">Assigned Projects</FormLabel>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 rounded-lg border bg-muted/30">
        {selectedIds.map((id: string) => {
          const project = projects.find((p: any) => p.id === id)
          return (
            <Badge key={id} variant="secondary" className="gap-1 pr-1.5 py-1.5 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
              <span className="max-w-[200px] truncate">{project?.name || id}</span>
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleProject(id)
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          )
        })}
        {selectedIds.length === 0 && <span className="text-xs text-muted-foreground/60 italic self-center px-1">Initial state: No projects assigned</span>}
      </div>

      {isLoading ? (
        <div className="h-10 w-full rounded-lg bg-muted/20 animate-pulse flex items-center px-3 gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-dashed text-xs text-muted-foreground bg-muted/10">
          No projects created. Go to Projects page to create one.
        </div>
      ) : unselectedProjects.length === 0 ? (
        <div className="p-3 text-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-xs font-medium">
          ✓ All available projects are already assigned to this workspace.
        </div>
      ) : (
        <Select onValueChange={(val) => toggleProject(val)} value="">
          <SelectTrigger className="w-full h-10 transition-all hover:border-primary/50 focus:ring-1 focus:ring-primary">
            <SelectValue placeholder="Add another project to this workspace..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedProjects.map((p: any) => (
              <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{p.name}</span>
                  {p.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
