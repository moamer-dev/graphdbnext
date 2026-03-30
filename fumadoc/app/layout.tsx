import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter, EB_Garamond } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata = {
  title: 'Plexus Documentation',
  description: 'Advanced graph database management and modeling platform documentation.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable} font-sans`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ enabled: true }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
