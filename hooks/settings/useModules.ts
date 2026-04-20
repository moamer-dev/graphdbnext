import { useQuery } from '@tanstack/react-query'
import type { Module } from '@/modules/types'

export const MODULES_QUERY_KEY = ['modules']

export function useModules() {
  const { data, isLoading, error } = useQuery({
    queryKey: MODULES_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('/api/modules')
      if (!response.ok) {
        throw new Error('Failed to fetch modules')
      }
      const result = await response.json()
      return result.modules as Module[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const modules = data || []

  const isModuleEnabled = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    return module ? module.enabled : false
  }

  return { 
    modules, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null, 
    isModuleEnabled 
  }
}
