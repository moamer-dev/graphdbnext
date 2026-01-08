'use client'

import * as React from 'react'
import { startTransition } from 'react'

export function ClientOnly ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    startTransition(() => {
      setHasMounted(true)
    })
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

