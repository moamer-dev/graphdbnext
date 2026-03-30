import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { LayoutDashboard, Package } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout 
      tree={source.getPageTree()} 
      {...baseOptions()}
      tabs={[
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
      ]}
    >
      {children}
    </DocsLayout>
  );
}
