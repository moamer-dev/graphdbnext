import { type LucideIcon, Database, Network, Users, Settings, LayoutDashboard, FolderKanban, LayoutGrid } from 'lucide-react'

export interface SidebarNavItem {
  title: string
  url: string
  icon: LucideIcon
  items?: {
    title: string
    url: string
    section?: string
    resource?: 'MODEL' | 'WORKSPACE' | 'CREDENTIAL' | 'PROJECT' | 'TEAM' | 'SAVED_QUERY' | 'WORKFLOW' | 'DATA_SOURCE'
    action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE'
  }[]
  adminOnly?: boolean
  resource?: 'MODEL' | 'WORKSPACE' | 'CREDENTIAL' | 'PROJECT' | 'TEAM' | 'SAVED_QUERY' | 'WORKFLOW' | 'DATA_SOURCE'
  action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE'
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
    items: [
      {
        title: 'Create Model',
        url: '/dashboard/graph/model/new',
        section: 'create-model'
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
        section: 'xml-importer'
      },
    ]
  },
  {
    title: 'Database',
    url: '/dashboard/database',
    icon: Database,
    items: [
      {
        title: 'Management',
        url: '/dashboard/database',
        section: 'database',
        resource: 'MODEL'
      },
      {
        title: 'Queries',
        url: '/dashboard/database/queries',
        section: 'queries'
      },
      {
        title: 'Analytics',
        url: '/dashboard/database/analytics',
        section: 'analytics'
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
    url: '/dashboard/settings',
    icon: Settings,
    adminOnly: true,
    items: [
      {
        title: 'Modules',
        url: '/dashboard/settings/modules',
        section: 'modules'
      },
      {
        title: 'AI Settings',
        url: '/dashboard/settings/ai',
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

