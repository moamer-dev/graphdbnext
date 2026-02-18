import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Disabled due to worker memory crashes with large codebase
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    'reactflow',
    '@radix-ui/react-dialog',
    '@radix-ui/react-label',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-select',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-popover',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-alert-dialog',
  ],
})
