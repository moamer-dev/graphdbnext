'use client'

import { useEffect, useState } from 'react'
import { useModelBuilder } from '@/lib/hooks/useModelBuilder'
import { XmlImportWizard, AISettingsProvider } from '@graphdb/model-builder'
import type { AISettings } from '@graphdb/model-builder'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import { ModelResource } from '@/lib/resources/ModelResource'
import { useRouter } from 'next/navigation'
import { DEFAULT_AI_SETTINGS } from '@/lib/ai/ApiAISettingsStorage'

export default function NewModelFromXmlPage () {
  const router = useRouter()
  const { isEnabled, loading: moduleLoading } = useModelBuilder()
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)

  // Fetch AI settings from parent app's API
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        const response = await fetch('/api/ai-settings', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const settings = await response.json() as AISettings
          setAiSettings(settings)
        } else {
          setAiSettings(DEFAULT_AI_SETTINGS)
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error)
        setAiSettings(DEFAULT_AI_SETTINGS)
      }
    }

    fetchAISettings()
  }, [])

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isEnabled) {
    return (
      <div className="space-y-4 mt-4">
        <div className="gradient-header-minimal pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(ModelResource.LIST_PATH)}
                className="h-7 text-xs hover:bg-muted/40"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Back to Models
              </Button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Create Model from XML
                </h1>
              </div>
            </div>
          </div>
        </div>
        <Alert>
          <AlertDescription>
            Model Builder module is not enabled. Please enable it in Settings → Modules to create models from XML.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="gradient-header-minimal pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(ModelResource.LIST_PATH)}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back to Models
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Create Model from XML
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                Upload an XML file (TEI, edXML, etc.) and build your model schema from its structure
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {aiSettings ? (
          <AISettingsProvider settings={aiSettings}>
            <XmlImportWizard
              onImportComplete={() => {
                // Redirect to model builder to refine the model
                // Pass 'from=xml' query param to indicate we came from XML import
                router.push('/dashboard/graph/model/new?from=xml')
              }}
            />
          </AISettingsProvider>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

