import type { TibOntology, TibClass, TibProperty, TibApiResponse } from '../types/semanticTypes'

// Simple LRU Cache implementation
class LRUCache<T> {
    private cache: Map<string, { value: T; timestamp: number }>
    private maxSize: number
    private ttl: number // Time to live in milliseconds

    constructor(maxSize: number = 100, ttlMinutes: number = 30) {
        this.cache = new Map()
        this.maxSize = maxSize
        this.ttl = ttlMinutes * 60 * 1000
    }

    get(key: string): T | null {
        const item = this.cache.get(key)
        if (!item) return null

        // Check if expired
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key)
            return null
        }

        // Move to end (LRU)
        this.cache.delete(key)
        this.cache.set(key, item)
        return item.value
    }

    set(key: string, value: T): void {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            if (firstKey !== undefined) {
                this.cache.delete(firstKey)
            }
        }

        this.cache.set(key, { value, timestamp: Date.now() })
    }

    clear(): void {
        this.cache.clear()
    }
}

// Cache instances
const ontologiesCache = new LRUCache<TibApiResponse<TibOntology>>(50, 30)
const classesCache = new LRUCache<TibApiResponse<TibClass>>(100, 30)
const propertiesCache = new LRUCache<TibApiResponse<TibProperty>>(100, 30)

const BASE_URL = 'https://api.terminology.tib.eu/api/v2'

/**
 * Fetch ontologies from TIB API with caching
 */
export async function fetchOntologies(
    page: number = 1,
    size: number = 20,
    search?: string
): Promise<TibApiResponse<TibOntology> | null> {
    try {
        const cacheKey = `ontologies_${page}_${size}_${search || ''}`
        const cached = ontologiesCache.get(cacheKey)
        if (cached) {
            console.log('[TIB] Using cached ontologies')
            return cached
        }

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            lang: 'en',
            searchFields: 'ontologyId',
            boostFields: 'label^100 curie^50',
            exactMatch: 'false',
            includeObsoleteEntities: 'false',
            exclusive: 'false',
            option: 'LINEAR'
        })

        if (search) {
            params.set('search', search)
        }

        const response = await fetch(`${BASE_URL}/ontologies?${params.toString()}`, {
            headers: {
                'accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error(`[TIB] Failed to fetch ontologies: ${response.statusText}`)
            return null
        }


        const data: TibApiResponse<TibOntology> = await response.json()
        ontologiesCache.set(cacheKey, data)
        return data
    } catch (error) {
        console.error('[TIB] Error fetching ontologies:', error)
        return null
    }
}

/**
 * Fetch classes from TIB API with caching
 */
export async function fetchClasses(
    page: number = 1,
    size: number = 20,
    search?: string,
    ontologyId?: string
): Promise<TibApiResponse<TibClass> | null> {
    try {
        const cacheKey = `classes_${page}_${size}_${search || ''}_${ontologyId || ''}`
        const cached = classesCache.get(cacheKey)
        if (cached) {
            console.log('[TIB] Using cached classes')
            return cached
        }

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            lang: 'en',
            searchFields: 'label^100 description',
            boostFields: 'label^100 curie^50',
            exactMatch: 'false',
            includeObsoleteEntities: 'false',
            exclusive: 'false',
            option: 'LINEAR'
        })

        if (search) {
            params.set('search', search)
        }

        if (ontologyId) {
            params.set('ontology', ontologyId)
        }

        const response = await fetch(`${BASE_URL}/classes?${params.toString()}`, {
            headers: {
                'accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error(`[TIB] Failed to fetch classes: ${response.statusText}`)
            return null
        }

        const data: TibApiResponse<any> = await response.json()

        // Transform API response: label is an array, we need preferredLabel as string
        const transformedData: TibApiResponse<TibClass> = {
            ...data,
            elements: data.elements.map((cls: any) => ({
                iri: cls.iri,
                preferredLabel: Array.isArray(cls.label) ? cls.label[0] : cls.label || cls.iri,
                curie: cls.curie || '',
                ontologyId: cls.ontologyId || ontologyId || '',
                description: Array.isArray(cls.definition) ? cls.definition[0] : cls.definition,
                parents: cls.directParent || []
            }))
        }

        classesCache.set(cacheKey, transformedData)
        return transformedData
    } catch (error) {
        console.error('[TIB] Error fetching classes:', error)
        return null
    }
}

/**
 * Fetch properties from TIB API with caching
 */
export async function fetchProperties(
    page: number = 1,
    size: number = 20,
    search?: string,
    ontologyId?: string
): Promise<TibApiResponse<TibProperty> | null> {
    try {
        const cacheKey = `properties_${page}_${size}_${search || ''}_${ontologyId || ''}`
        const cached = propertiesCache.get(cacheKey)
        if (cached) {
            return cached
        }

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            lang: 'en',
            searchFields: 'label^100 description',
            boostFields: 'label^100 curie^50',
            exactMatch: 'false',
            includeObsoleteEntities: 'false',
            exclusive: 'false',
            option: 'LINEAR'
        })

        if (search) {
            params.set('search', search)
        }

        if (ontologyId) {
            params.set('ontology', ontologyId)
        }

        const response = await fetch(`${BASE_URL}/properties?${params.toString()}`, {
            headers: {
                'accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error(`[TIB] Failed to fetch properties: ${response.statusText}`)
            return null
        }

        const data: TibApiResponse<any> = await response.json()

        // Transform API response: label is an array, we need preferredLabel as string
        const transformedData: TibApiResponse<TibProperty> = {
            ...data,
            elements: data.elements.map((prop: any) => ({
                iri: prop.iri,
                preferredLabel: Array.isArray(prop.label) ? prop.label[0] : prop.label || prop.iri,
                curie: prop.curie || '',
                ontologyId: prop.ontologyId || ontologyId || '',
                description: Array.isArray(prop.definition) ? prop.definition[0] : prop.definition,
                domain: prop.domain || [],
                range: prop.range || []
            }))
        }

        propertiesCache.set(cacheKey, transformedData)
        return transformedData
    } catch (error) {
        console.error('[TIB] Error fetching properties:', error)
        return null
    }
}

/**
 * Clear all TIB caches
 */
export function clearTibCaches(): void {
    ontologiesCache.clear()
    classesCache.clear()
    propertiesCache.clear()
    console.log('[TIB] All caches cleared')
}
