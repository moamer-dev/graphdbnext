'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const RootProvider = dynamic(() => import('fumadocs-ui/provider/next').then(mod => mod.RootProvider), {
  ssr: false
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      {children}
    </RootProvider>
  );
}
