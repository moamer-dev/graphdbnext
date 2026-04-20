import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class SettingsService {
  private static ID = 'singleton'

  static async getGlobalSettings() {
    try {
      let settings = await prisma.globalSettings.findUnique({
        where: { id: this.ID }
      })

      if (!settings) {
        console.log('SettingsService: Initializing global settings...')
        settings = await prisma.globalSettings.create({
          data: {
            id: this.ID,
            modules: {},
            ai: {}
          }
        })
      }

      return settings
    } catch (error: any) {
      console.error('SettingsService: Error in getGlobalSettings:', error)
      // If error is that the table doesn't exist, we might need a migration
      throw new Error(`Failed to retrieve global settings: ${error.message}`)
    }
  }

  static async updateModules(modules: Record<string, boolean>) {
    try {
      console.log('SettingsService: Updating modules:', modules)
      
      // We use upsert to ensure the record exists
      return await prisma.globalSettings.upsert({
        where: { id: this.ID },
        update: {
          modules: modules as any,
          updatedAt: new Date()
        },
        create: {
          id: this.ID,
          modules: modules as any,
          ai: {}
        }
      })
    } catch (error: any) {
      console.error('SettingsService: Error in updateModules:', error)
      throw new Error(`Database error while updating modules: ${error.message}`)
    }
  }

  static async updateAI(ai: any) {
    try {
      console.log('SettingsService: Updating AI:', ai)
      return await prisma.globalSettings.upsert({
        where: { id: this.ID },
        update: {
          ai: ai as any,
          updatedAt: new Date()
        },
        create: {
          id: this.ID,
          ai: ai as any,
          modules: {}
        }
      })
    } catch (error: any) {
      console.error('SettingsService: Error in updateAI:', error)
      throw new Error(`Database error while updating AI settings: ${error.message}`)
    }
  }
}
