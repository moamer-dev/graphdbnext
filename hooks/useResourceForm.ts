import { useForm, FieldValues, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resourceHooks } from '@/hooks/react-query'
import React, { useCallback } from 'react'

interface UseResourceFormOptions<T extends z.ZodType<any, any, any>> {
  resourceName: keyof typeof resourceHooks
  schema: T
  defaultValues?: z.infer<T>
  onSuccess?: (data: any) => void
  redirect?: boolean
}

export function useResourceForm<T extends z.ZodType<any, any, any>>({
  resourceName,
  schema,
  defaultValues,
  onSuccess,
  redirect
}: UseResourceFormOptions<T>) {
  const resource = resourceHooks[resourceName] as any
  const createMutation = resource.useCreate({
    redirect,
    onSuccess: (data: any) => {
        form.reset(defaultValues)
        onSuccess?.(data)
    }
  })

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues
  })

  // Sync with defaultValues when they change (e.g. tenant context change)
  React.useEffect(() => {
    if (!form.formState.isDirty) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const onSubmit = useCallback(async (values: z.infer<T>) => {
    try {
      await createMutation.mutateAsync(values)
    } catch (error) {
      console.error(`Failed to create ${String(resourceName)}:`, error)
    }
  }, [createMutation, resourceName])

  return {
    form: form as UseFormReturn<z.infer<T>>,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: createMutation.isPending,
    error: createMutation.error
  }
}

interface UseResourceUpdateOptions<T extends z.ZodType<any, any, any>> {
    resourceName: keyof typeof resourceHooks
    schema: T
    id: string
    defaultValues?: z.infer<T>
    onSuccess?: (data: any) => void
}

export function useResourceUpdate<T extends z.ZodType<any, any, any>>({
    resourceName,
    schema,
    id,
    defaultValues,
    onSuccess
}: UseResourceUpdateOptions<T>) {
    const resource = resourceHooks[resourceName] as any
    
    // Fetch current data
    const { data: currentData, isLoading: isLoadingData } = resource.useSingle(id, !!id)
    
    const updateMutation = resource.useUpdate({
        onSuccess: (data: any) => {
            onSuccess?.(data)
        }
    })

    const form = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues || {}
    })

    // Update form values when data is loaded
    React.useEffect(() => {
        if (currentData?.data) {
            const rawData = currentData.data
            const formattedData = { ...rawData }
            
            // Map Team projects to projectIds
            if (rawData.projects && Array.isArray(rawData.projects)) {
                formattedData.projectIds = rawData.projects.map((p: any) => p.id || p.projectId || p.project?.id)
            }
            
            // Map Project workspaces to workspaceIds (via junction table or direct)
            if (rawData.workspaces && Array.isArray(rawData.workspaces)) {
                formattedData.workspaceIds = rawData.workspaces.map((w: any) => w.id || w.workspaceId || w.workspace?.id)
            }

            // Map Workspace projects to projectIds
            if (rawData.projectIds === undefined && rawData.projects && Array.isArray(rawData.projects)) {
                formattedData.projectIds = rawData.projects.map((p: any) => p.id || p.projectId || p.project?.id)
            }

            // Sanitize null values to avoid React controlled/uncontrolled warnings
            Object.keys(formattedData).forEach(key => {
                if (formattedData[key] === null) {
                    formattedData[key] = ''
                }
            })
            
            form.reset(formattedData)
        }
    }, [currentData, form])

    const onSubmit = useCallback(async (values: z.infer<T>) => {
        try {
            await updateMutation.mutateAsync({ id, data: values })
        } catch (error) {
            console.error(`Failed to update ${String(resourceName)}:`, error)
        }
    }, [updateMutation, id, resourceName])

    return {
        form: form as UseFormReturn<z.infer<T>>,
        onSubmit: form.handleSubmit(onSubmit),
        isSubmitting: updateMutation.isPending,
        isLoadingData,
        error: updateMutation.error
    }
}
