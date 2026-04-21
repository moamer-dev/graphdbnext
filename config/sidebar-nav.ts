import { type LucideIcon, Database, Network, Users, Settings, LayoutDashboard, FolderKanban, LayoutGrid } from 'lucide-react'

export interface SidebarNavItem {
  title: string
  url: string
  icon: LucideIcon
  items?: {
    title: string
    url: string
    section?: string
    moduleId?: string
    resource?: string
    action?: string
  }[]
  moduleId?: string
  adminOnly?: boolean
  resource?: string
  action?: string
}

export const sidebarNavItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard
  },

  {
    title: 'Plexus',
    url: '/dashboard/graph',
    icon: Network,
    resource: 'MODEL',
    action: 'READ',
    items: [
      {
        title: 'Create Model',
        url: '/dashboard/graph/model/new',
        section: 'create-model',
        moduleId: 'plexus-builder'
      },
      {
        title: 'Schema Models',
        url: '/dashboard/graph/model',
        section: 'schema',
        resource: 'MODEL'
      },
      {
        title: 'XML Importer',
        url: '/dashboard/graph/model/new/from-xml',
        section: 'xml-importer',
        moduleId: 'plexus-builder'
      },
    ]
  },
  {
    title: 'Database',
    url: '/dashboard/database',
    icon: Database,
    resource: 'DATABASE',
    action: 'ACCESS',
    items: [
      {
        title: 'Management',
        url: '/dashboard/database',
        resource: 'DATABASE',
        action: 'ACCESS'
      },
      {
        title: 'Data Sources',
        url: '/dashboard/database/sources',
        resource: 'DATA_SOURCE_PAGE',
        action: 'ACCESS'
      },
      {
        title: 'Queries',
        url: '/dashboard/database/queries',
        section: 'queries',
        resource: 'QUERY'
      },
      {
        title: 'Analytics',
        url: '/dashboard/database/analytics',
        section: 'analytics',
        resource: 'ANALYTICS'
      }
    ]
  },
  {
    title: 'Admin',
    url: '/dashboard/admin',
    icon: Users,
    adminOnly: true,
    items: [
      {
        title: 'Users',
        url: '/dashboard/admin/users',
        section: 'users'
      },
      {
        title: 'Roles & Permissions',
        url: '/dashboard/admin/roles',
        section: 'roles'
      },
      {
        title: 'Storage Config',
        url: '/dashboard/admin/storage',
        section: 'storage'
      },
      {
        title: 'Saved Queries',
        url: '/dashboard/admin/queries',
        section: 'queries'
      }
    ]
  },
  {
    title: 'Settings',
    url: '/dashboard/admin/settings',
    icon: Settings,
    adminOnly: true,
    items: [
      {
        title: 'Modules',
        url: '/dashboard/admin/settings/modules',
        section: 'modules'
      },
      {
        title: 'AI Settings',
        url: '/dashboard/admin/settings/ai',
        section: 'ai'
      }
    ]
  },
  {
    title: 'Teams',
    url: '/dashboard/teams',
    icon: Users,
    resource: 'TEAM'
  },
  {
    title: 'Projects',
    url: '/dashboard/projects',
    icon: FolderKanban,
    resource: 'PROJECT'
  },
  {
    title: 'Workspaces',
    url: '/dashboard/workspaces',
    icon: LayoutGrid,
    resource: 'WORKSPACE'
  }
]
