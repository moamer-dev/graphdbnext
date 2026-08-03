import { Prisma } from '@prisma/client'

export function parseFilters(filters: Record<string, any>): Record<string, any> {
  const parsedFilters: Record<string, any> = {}

  Object.entries(filters).forEach(([key, value]) => {
    // Skip empty values or instructional frontend-only flags
    if (value === '' || value === null || value === undefined || value === 'all' || key === 'isGlobal' || key === 'scope') {
      return
    }

    // Parse boolean strings
    if (value === 'true') {
      parsedFilters[key] = true
      return
    }
    if (value === 'false') {
      parsedFilters[key] = false
      return
    }

    // Handle date fields (assuming common names like createdAt, updatedAt)
    if (key === 'createdAt' || key === 'updatedAt' || key.toLowerCase().includes('date')) {
      const date = new Date(value as string)
      if (!isNaN(date.getTime())) {
        // Create a range for the entire day
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        parsedFilters[key] = {
          gte: startOfDay,
          lte: endOfDay
        }
        return
      }
    }

    // Default: use as is (likely string or number)
    parsedFilters[key] = value
  })

  return parsedFilters
}
