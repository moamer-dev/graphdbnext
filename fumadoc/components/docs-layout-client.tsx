'use client';

import { DocsLayout as BaseLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { LayoutDashboard, Package } from 'lucide-react';

export function DocsLayoutClient({ 
  children, 
  tree 
}: { 
  children: ReactNode; 
  tree: any;
}) {
  return (
    <BaseLayout
      tree={tree}
      nav={{ enabled: false }}
      sidebar={{
        tabs: [
          {
            title: 'Plexus Platform',
            description: 'Guides for researchers and users of the main interface',
            url: '/docs/app',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            title: 'Plexus Builder',
            description: 'Developer documentation for the @plexus/builder package',
            url: '/docs/builder',
            icon: <Package className="w-4 h-4" />,
          },
        ]
      }}
      slots={{
        navTitle: () => (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold shrink-0">P</div>
            <span className="font-semibold tracking-tight truncate text-sm">Plexus</span>
          </div>
        )
      }}
    >
      {children}
    </BaseLayout>
  );
}
