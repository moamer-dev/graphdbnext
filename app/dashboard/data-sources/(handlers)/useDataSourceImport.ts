'use client'

import { useState, useCallback, useEffect } from 'react'
import { resourceHooks } from '@/hooks/react-query'
import { DataSourceType } from '@prisma/client'
import { useTenantStore } from '@/stores/tenantStore'
import { toast } from 'sonner'

export interface FileWithContent {
  file: File
  content: string | any
  type: DataSourceType
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

export function useDataSourceImport(open: boolean, onOpenChange: (open: boolean) => void) {
  const { activeWorkspaceId } = useTenantStore()
  
  const [files, setFiles] = useState<FileWithContent[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(activeWorkspaceId)
  const [isDragActive, setIsDragActive] = useState(false)
  
  const createDataSource = resourceHooks.dataSources.useCreate({
      redirect: false,
      showToast: false
  })
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = resourceHooks.workspaces.useList({
      pageSize: 100,
      mine: true
  })

  // Fetch storage configs for routing preview
  const { data: storageConfigsData } = resourceHooks.storageConfigs.useList({ 
    pageSize: 100 
  })
  
  const storageConfigs = (storageConfigsData?.data || []) as any[]

  // Pre-populate when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWorkspaceId(activeWorkspaceId)
    }
  }, [open, activeWorkspaceId])


  const workspaces = workspacesData?.data || []

  /**
   * Predicts which storage provider will be used based on rules
   */
  const getMatchedStorage = useCallback((file: File, type: DataSourceType) => {
    if (storageConfigs.length === 0) return null
    
    const size = file.size
    
    // Check for explicit matches
    for (const config of storageConfigs) {
      if (!config.isActive) continue
      
      const rules = config.config?.routingRules
      if (rules) {
        const { minSize, maxSize, allowedTypes } = rules
        const matchesSize = (!minSize || size >= minSize) && (!maxSize || size <= maxSize)
        const matchesType = !allowedTypes || allowedTypes.includes(type)
        
        if (matchesSize && matchesType) return config
      }
    }
    
    // Fallback to default
    return storageConfigs.find(c => c.isDefault) || storageConfigs[0]
  }, [storageConfigs])

  const processFile = useCallback(async (file: File): Promise<FileWithContent> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      const extension = file.name.split('.').pop()?.toLowerCase()
      let type: DataSourceType = DataSourceType.API_RESPONSE 

      if (extension === 'json') type = DataSourceType.JSON
      if (extension === 'xml') type = DataSourceType.XML

      reader.onload = (e) => {
        const content = e.target?.result as string
        if (type === DataSourceType.JSON) {
          try {
            const jsonContent = JSON.parse(content)
            resolve({ file, content: jsonContent, type, status: 'idle' })
          } catch {
            resolve({ file, content, type: DataSourceType.API_RESPONSE, status: 'error', error: 'Invalid JSON format' })
          }
        } else {
          resolve({ file, content, type, status: 'idle' })
        }
      }
      reader.onerror = () => resolve({ file, content: '', type, status: 'error', error: 'Failed to read file' })
      reader.readAsText(file)
    })
  }, [])

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = await Promise.all(Array.from(e.target.files).map(processFile))
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    const filesToUpload = files.filter(f => f.status === 'idle')
    if (filesToUpload.length === 0) return

    for (let i = 0; i < files.length; i++) {
        if (files[i].status !== 'idle') continue

        setFiles(prev => {
            const updated = [...prev]
            updated[i].status = 'uploading'
            return updated
        })

        try {
            const payload: any = {
                name: files[i].file.name,
                type: files[i].type,
                workspaceId: selectedWorkspaceId || null,
            }

            if (files[i].type === DataSourceType.JSON) {
                payload.jsonContent = files[i].content
            } else {
                payload.content = files[i].content
            }

            await createDataSource.mutateAsync(payload)

            setFiles(prev => {
                const updated = [...prev]
                updated[i].status = 'success'
                return updated
            })
        } catch (error: any) {
            setFiles(prev => {
                const updated = [...prev]
                updated[i].status = 'error'
                updated[i].error = error.message
                return updated
            })
        }
    }

    const successCount = files.filter(f => f.status === 'success' || (f.status === 'uploading' && !f.error)).length
    if (successCount === files.length) {
        toast.success(`Successfully uploaded ${files.length} resources`)
        onOpenChange(false)
        setFiles([])
    }
  }

  return {
    files,
    setFiles,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    isDragActive,
    setIsDragActive,
    workspaces,
    isLoadingWorkspaces,
    processFile,
    onFileSelect,
    removeFile,
    handleUpload,
    isUploading: createDataSource.isPending,
    activeWorkspaceId,
    getMatchedStorage
  }
}
