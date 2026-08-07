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
    title: 'Workspaces & Projects',
    url: '/dashboard/workspaces',
    icon: LayoutGrid,
    resource: 'WORKSPACE',
    items: [
      {
        title: 'Workspace Hub',
        url: '/dashboard/workspaces/hub',
        resource: 'WORKSPACE_HUB',
        action: 'ACCESS'
      },
      {
        title: 'All Workspaces',
        url: '/dashboard/workspaces',
        resource: 'WORKSPACE'
      },
      {
        title: 'Projects',
        url: '/dashboard/projects',
        resource: 'PROJECT'
      },
      {
        title: 'Teams',
        url: '/dashboard/teams',
        resource: 'TEAM'
      }
    ]
  },
  {
    title: 'Plexus Builder',
    url: '/dashboard/graph/model',
    icon: Network,
    resource: 'MODEL',
    action: 'READ',
    items: [
      {
        title: 'Schema Models',
        url: '/dashboard/graph/model',
        section: 'schema',
        resource: 'MODEL'
      },
      {
        title: 'Create Model',
        url: '/dashboard/graph/model/new',
        section: 'create-model',
        moduleId: 'plexus-builder'
      },
      {
        title: 'XML Importer Wizard',
        url: '/dashboard/graph/model/new/from-xml',
        section: 'xml-importer',
        moduleId: 'plexus-builder'
      }
    ]
  },
  {
    title: 'Data & API Assets',
    url: '/dashboard/data-sources',
    icon: Database,
    resource: 'DATA_SOURCE_PAGE',
    action: 'ACCESS',
    items: [
      {
        title: 'Data Sources (XML Library)',
        url: '/dashboard/data-sources',
        resource: 'DATA_SOURCE_PAGE',
        action: 'ACCESS'
      },
      {
        title: 'API Credentials',
        url: '/dashboard/credentials',
        resource: 'CREDENTIAL'
      }
    ]
  },
  {
    title: 'Graph Database',
    url: '/dashboard/database',
    icon: Database,
    resource: 'DATABASE',
    action: 'ACCESS',
    items: [
      {
        title: 'Database Explorer',
        url: '/dashboard/database',
        resource: 'DATABASE',
        action: 'ACCESS'
      },
      {
        title: 'Query Studio (Cypher)',
        url: '/dashboard/database/queries',
        section: 'queries',
        resource: 'QUERY'
      },
      {
        title: 'Graph Analytics',
        url: '/dashboard/database/analytics',
        section: 'analytics',
        resource: 'ANALYTICS'
      }
    ]
  },
  {
    title: 'Administration',
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
  }
]
