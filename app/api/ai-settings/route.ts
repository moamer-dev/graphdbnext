import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { AISettings } from '@plexus/builder'
import { SettingsService } from '@/services/SettingsService'

// Define default settings locally to avoid import issues
const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  model: {
    provider: 'openai',
    modelName: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 4000
  },
  features: {
    enabled: false,
    researchAssistantChatbot: false,
    xmlMappingAssistant: false,
    schemaDesignAgent: false,
    workflowGenerationAgent: false,
    relationshipRecommendation: false,
    nodePropertySuggestion: false,
    schemaOptimization: false,
    aiAgentsAsTools: false,
    semanticEnrichment: false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const globalSettings = await SettingsService.getGlobalSettings()
    
    // Return stored settings if they exist and are valid, otherwise return defaults
    if (globalSettings?.ai) {
      const storedSettings = globalSettings.ai as unknown as AISettings
      // Merge with defaults to ensure all properties exist
      // Note: The spread operator will preserve apiKey from storedSettings.model if it exists
      const settings: AISettings = {
        ...DEFAULT_AI_SETTINGS,
        ...storedSettings,
        features: {
          ...DEFAULT_AI_SETTINGS.features,
          ...storedSettings.features
        },
        model: {
          ...DEFAULT_AI_SETTINGS.model,
          ...storedSettings.model
        }
      }
      return NextResponse.json(settings)
    }

    return NextResponse.json(DEFAULT_AI_SETTINGS)
  } catch (error: unknown) {
    console.error('Error fetching AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only admins can update AI settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - only admins can change AI settings' },
        { status: 403 }
      )
    }

    const settings: AISettings = await request.json()

    await SettingsService.updateAI(settings)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error saving AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Set to empty object to reset
    await SettingsService.updateAI({})

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error clearing AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to clear AI settings' },
      { status: 500 }
    )
  }
}
