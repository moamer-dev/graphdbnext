'use client'

import { QueryClient } from '@tanstack/react-query'

/**
 * Default query client configuration
 * 
 * Best practices:
 * - staleTime: 5 minutes - data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - unused cache is garbage collected after 10 minutes
 * - retry: 1 - retry failed requests once
 * - refetchOnWindowFocus: false - don't refetch when window regains focus (better UX)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true
    },
    mutations: {
      retry: 1
    }
  }
})

