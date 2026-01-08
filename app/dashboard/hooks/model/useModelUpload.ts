'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ModelResource } from '@/lib/resources/ModelResource'

interface UseModelUploadOptions {
  onSuccess?: (modelId: string) => void
}

/**
 * Custom hook for model upload functionality
 * Extracts business logic from the page component
 */
export function useModelUpload (options?: UseModelUploadOptions) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const uploadModel = async (data: {
    file: File
    name: string
    description?: string
  }) => {
    if (!data.file || !data.name) {
      toast.error('Please provide a model name and select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      if (data.description) {
        formData.append('description', data.description)
      }

      const response = await fetch('/api/models/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Model uploaded successfully')
        
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['models'] })
        
        if (result.model) {
          options?.onSuccess?.(result.model.id)
          router.push(`${ModelResource.VIEW_PATH}/${result.model.id}`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload model')
      }
    } catch (error) {
      console.error('Error uploading model:', error)
      toast.error('Error uploading model')
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadModel,
    uploading
  }
}

