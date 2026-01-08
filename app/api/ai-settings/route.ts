import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { AISettings } from '@graphdb/model-builder'

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
    aiAgentsAsTools: false
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

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { aiSettings: true }
    })

    // Return stored settings if they exist and are valid, otherwise return defaults
    if (userSettings?.aiSettings) {
      const storedSettings = userSettings.aiSettings as unknown as AISettings
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

    const settings: AISettings = await request.json()

    // Cast to Prisma Json type for storage
    const settingsJson = settings as unknown as Prisma.InputJsonValue

    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        aiSettings: settingsJson
      },
      update: {
        aiSettings: settingsJson
      }
    })

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

    // Use upsert to handle case where UserSettings doesn't exist yet
    // Set to Prisma.JsonNull to clear the settings
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        aiSettings: Prisma.JsonNull
      },
      update: {
        aiSettings: Prisma.JsonNull
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error clearing AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to clear AI settings' },
      { status: 500 }
    )
  }
}
