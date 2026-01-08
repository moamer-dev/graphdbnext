import { useState, useEffect, useCallback } from 'react'
import {
    fetchOntologies,
    fetchClasses,
    fetchProperties
} from '../services/tibTerminologyService'
import type { TibOntology, TibClass, TibProperty, TibApiResponse } from '../types/semanticTypes'

interface UseOntologiesResult {
    ontologies: TibOntology[]
    loading: boolean
    error: string | null
    totalPages: number
    currentPage: number
    setPage: (page: number) => void
    search: (query: string) => void
}

/**
 * Hook to fetch and manage ontologies from TIB API
 */
export function useOntologies(enabled: boolean = true): UseOntologiesResult {
    const [allOntologies, setAllOntologies] = useState<TibOntology[]>([]) // Store all fetched ontologies
    const [ontologies, setOntologies] = useState<TibOntology[]>([]) // Filtered/displayed ontologies
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const loadOntologies = useCallback(async () => {
        if (!enabled) return

        setLoading(true)
        setError(null)

        try {
            // First, fetch the first page to get total pages info
            const firstPage = await fetchOntologies(1, 20, undefined) // No search query - get all
            if (!firstPage) {
                setError('Failed to fetch ontologies')
                setAllOntologies([])
                setOntologies([])
                return
            }

            const firstPageItems = firstPage.elements || []
            const totalPages = firstPage.totalPages || 1

            // If there's only one page, we're done
            if (totalPages === 1) {
                firstPageItems.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()))
                setAllOntologies(firstPageItems as TibOntology[])
                setOntologies(firstPageItems as TibOntology[])
                setTotalPages(totalPages)
                setLoading(false)
                return
            }

            // Fetch all remaining pages in parallel
            const pagePromises = []
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetchOntologies(page, 20, undefined))
            }

            const remainingPages = await Promise.all(pagePromises)

            // Combine all results
            const allItems = [
                ...firstPageItems,
                ...remainingPages.flatMap(response => response?.elements || [])
            ]

            // Sort alphabetically by title (case-insensitive)
            allItems.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()))

            setAllOntologies(allItems as TibOntology[])
            setOntologies(allItems as TibOntology[])
            setTotalPages(totalPages)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setAllOntologies([])
            setOntologies([])
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        loadOntologies()
    }, [loadOntologies])

    // Client-side filtering when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setOntologies(allOntologies)
            return
        }

        const lowerQuery = searchQuery.toLowerCase()
        const filtered = allOntologies.filter((ontology: TibOntology) =>
            ontology.title?.toLowerCase().includes(lowerQuery) ||
            ontology.ontologyId?.toLowerCase().includes(lowerQuery) ||
            ontology.description?.toLowerCase().includes(lowerQuery)
        )

        setOntologies(filtered)
    }, [searchQuery, allOntologies])

    const search = useCallback((query: string) => {
        setSearchQuery(query)
        setCurrentPage(1) // Reset to first page on new search
    }, [])

    const setPage = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    return {
        ontologies,
        loading,
        error,
        totalPages,
        currentPage,
        setPage,
        search
    }
}

interface UseClassesResult {
    classes: TibClass[]
    loading: boolean
    error: string | null
    totalPages: number
    currentPage: number
    setPage: (page: number) => void
    search: (query: string) => void
}

/**
 * Hook to fetch and manage classes from TIB API
 */
export function useClasses(
    ontologyId: string | null = null,
    enabled: boolean = true
): UseClassesResult {
    const [allClasses, setAllClasses] = useState<TibClass[]>([]) // All fetched classes
    const [classes, setClasses] = useState<TibClass[]>([]) // Filtered classes
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const loadClasses = useCallback(async () => {
        if (!enabled) return

        setLoading(true)
        setError(null)

        try {
            // First, fetch the first page to get total pages info
            const firstPage = await fetchClasses(1, 20, undefined, ontologyId || undefined)

            if (!firstPage) {
                setError('Failed to fetch classes')
                setAllClasses([])
                setClasses([])
                return
            }

            const firstPageItems = firstPage.elements || []
            const total = firstPage.totalPages || 1

            // If there's only one page, we're done
            if (total === 1) {
                // Sort alphabetically
                firstPageItems.sort((a, b) => (a.preferredLabel || '').toLowerCase().localeCompare((b.preferredLabel || '').toLowerCase()))
                setAllClasses(firstPageItems as TibClass[])
                setClasses(firstPageItems as TibClass[])
                setTotalPages(total)
                setLoading(false)
                return
            }

            // Fetch all remaining pages in parallel
            const pagePromises = []
            for (let page = 2; page <= total; page++) {
                pagePromises.push(fetchClasses(page, 20, undefined, ontologyId || undefined))
            }

            const remainingPages = await Promise.all(pagePromises)

            // Combine all results
            const allItems = [
                ...firstPageItems,
                ...remainingPages.flatMap(response => response?.elements || [])
            ]

            // Sort alphabetically by label
            allItems.sort((a, b) => (a.preferredLabel || '').toLowerCase().localeCompare((b.preferredLabel || '').toLowerCase()))

            setAllClasses(allItems as TibClass[])
            setClasses(allItems as TibClass[])
            setTotalPages(total)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setAllClasses([])
            setClasses([])
        } finally {
            setLoading(false)
        }
    }, [enabled, ontologyId])

    useEffect(() => {
        loadClasses()
    }, [loadClasses])

    // Client-side filtering when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setClasses(allClasses)
            return
        }

        const lowerQuery = searchQuery.toLowerCase()
        const filtered = allClasses.filter((cls: TibClass) =>
            cls.preferredLabel?.toLowerCase().includes(lowerQuery) ||
            cls.curie?.toLowerCase().includes(lowerQuery) ||
            cls.iri?.toLowerCase().includes(lowerQuery)
        )

        setClasses(filtered)
    }, [searchQuery, allClasses])

    const search = useCallback((query: string) => {
        setSearchQuery(query)
        setCurrentPage(1)
    }, [])

    const setPage = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    return {
        classes,
        loading,
        error,
        totalPages,
        currentPage,
        setPage,
        search
    }
}

interface UsePropertiesResult {
    properties: TibProperty[]
    loading: boolean
    error: string | null
    totalPages: number
    currentPage: number
    setPage: (page: number) => void
    search: (query: string) => void
}

/**
 * Hook to fetch and manage properties from TIB API
 */
export function useProperties(
    ontologyId: string | null = null,
    enabled: boolean = true
): UsePropertiesResult {
    const [allProperties, setAllProperties] = useState<TibProperty[]>([])
    const [properties, setProperties] = useState<TibProperty[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const loadProperties = useCallback(async () => {
        if (!enabled) return

        setLoading(true)
        setError(null)

        try {
            // First page
            const firstPage = await fetchProperties(1, 20, undefined, ontologyId || undefined)

            if (!firstPage) {
                setError('Failed to fetch properties')
                setAllProperties([])
                setProperties([])
                return
            }

            const firstPageItems = firstPage.elements || []
            const total = firstPage.totalPages || 1

            if (total === 1) {
                firstPageItems.sort((a, b) => (a.preferredLabel || '').toLowerCase().localeCompare((b.preferredLabel || '').toLowerCase()))
                setAllProperties(firstPageItems as TibProperty[])
                setProperties(firstPageItems as TibProperty[])
                setTotalPages(total)
                setLoading(false)
                return
            }

            const pagePromises = []
            for (let page = 2; page <= total; page++) {
                pagePromises.push(fetchProperties(page, 20, undefined, ontologyId || undefined))
            }

            const remainingPages = await Promise.all(pagePromises)

            const allItems = [
                ...firstPageItems,
                ...remainingPages.flatMap(response => response?.elements || [])
            ]

            allItems.sort((a, b) => (a.preferredLabel || '').toLowerCase().localeCompare((b.preferredLabel || '').toLowerCase()))

            setAllProperties(allItems as TibProperty[])
            setProperties(allItems as TibProperty[])
            setTotalPages(total)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setAllProperties([])
            setProperties([])
        } finally {
            setLoading(false)
        }
    }, [enabled, ontologyId])

    useEffect(() => {
        loadProperties()
    }, [loadProperties])

    // Client-side filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setProperties(allProperties)
            return
        }

        const lowerQuery = searchQuery.toLowerCase()
        const filtered = allProperties.filter((prop: TibProperty) =>
            prop.preferredLabel?.toLowerCase().includes(lowerQuery) ||
            prop.curie?.toLowerCase().includes(lowerQuery) ||
            prop.iri?.toLowerCase().includes(lowerQuery)
        )

        setProperties(filtered)
    }, [searchQuery, allProperties])

    const search = useCallback((query: string) => {
        setSearchQuery(query)
        setCurrentPage(1)
    }, [])

    const setPage = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    return {
        properties,
        loading,
        error,
        totalPages,
        currentPage,
        setPage,
        search
    }
}
