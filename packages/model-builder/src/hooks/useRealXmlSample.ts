import { useState, useEffect, useMemo } from 'react'
import type { TestElementData } from './configuration/useToolTestExecution'

interface RealXmlInstance {
    index: number
    id: string | null
    preview: string
    element: Element
}

interface UseRealXmlSampleResult {
    instances: RealXmlInstance[]
    selectedInstanceIndex: number
    selectedInstanceData: TestElementData | null
    setInstanceIndex: (index: number) => void
    loading: boolean
    error: string | null
    sourceFileName: string | null
}

export function useRealXmlSample(
    file: File | null,
    tagName: string
): UseRealXmlSampleResult {
    const [instances, setInstances] = useState<RealXmlInstance[]>([])
    const [selectedInstanceIndex, setSelectedInstanceIndex] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [parsedDoc, setParsedDoc] = useState<Document | null>(null)

    // Parse file when it changes
    useEffect(() => {
        if (!file) {
            setParsedDoc(null)
            setInstances([])
            return
        }

        setLoading(true)
        setError(null)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const parser = new DOMParser()
                const doc = parser.parseFromString(text, 'text/xml')

                const parseError = doc.querySelector('parsererror')
                if (parseError) {
                    throw new Error('Failed to parse XML: ' + parseError.textContent)
                }

                setParsedDoc(doc)
            } catch (err) {
                console.error('XML Parse Error:', err)
                setError(err instanceof Error ? err.message : 'Unknown parse error')
                setParsedDoc(null)
            } finally {
                setLoading(false)
            }
        }

        reader.onerror = () => {
            setError('Failed to read file')
            setLoading(false)
        }

        reader.readAsText(file) // Read entire file - simplistic for now
    }, [file])

    // Extract instances when doc or tagName changes
    useEffect(() => {
        if (!parsedDoc || !tagName) {
            setInstances([])
            return
        }

        try {
            // Find elements by tag name
            // Try exact match first
            let elements: HTMLCollectionOf<Element> | Element[] = parsedDoc.getElementsByTagName(tagName)

            // If no elements found, try lowercase (common issue with labels vs xml tags)
            if (elements.length === 0) {
                elements = parsedDoc.getElementsByTagName(tagName.toLowerCase())
            }

            // If still nothing and tagName is lowercase, try Title Case (less common but possible)
            // Actually, let's just do a manual case-insensitive search if standard lookups fail
            // but only if the document is small enough to avoid perf issues
            if (elements.length === 0) {
                // Fallback: iterate all elements (expensive but robust for small samples)
                const allElements = parsedDoc.getElementsByTagName('*')
                const found: Element[] = []
                const lowerTagName = tagName.toLowerCase()

                for (let i = 0; i < allElements.length; i++) {
                    if (allElements[i].tagName.toLowerCase() === lowerTagName) {
                        found.push(allElements[i])
                        if (found.length >= 50) break // Limit here too
                    }
                }

                // Mock a NodeList-like object or just iterate the array
                // simpler to just use the array in the loop below
                elements = found
            }

            const foundInstances: RealXmlInstance[] = []
            // Limit to first 50 instances to avoid performance issues
            const maxInstances = 50

            for (let i = 0; i < Math.min(elements.length, maxInstances); i++) {
                const el = elements[i]
                const id = el.getAttribute('xml:id') || el.getAttribute('id')
                // Preview: text content snippet or attributes
                const textPreview = el.textContent?.slice(0, 30).trim() || ''
                const attrsPreview = Array.from(el.attributes)
                    .map(a => `${a.name}="${a.value}"`)
                    .join(' ')
                    .slice(0, 30)

                foundInstances.push({
                    index: i,
                    id: id || null,
                    preview: id ? `ID: ${id}` : (textPreview ? `"${textPreview}..."` : `<${tagName} ${attrsPreview}...>`),
                    element: el
                })
            }

            setInstances(foundInstances)
            setSelectedInstanceIndex(0) // Reset selection
        } catch (err) {
            console.error('Error finding instances:', err)
            setInstances([])
        }
    }, [parsedDoc, tagName])

    // Compute TestElementData for current selection
    const selectedInstanceData = useMemo<TestElementData | null>(() => {
        if (instances.length === 0 || selectedInstanceIndex >= instances.length) {
            return null
        }

        const instance = instances[selectedInstanceIndex]
        const el = instance.element

        // Extract attributes
        const attributes: Record<string, string> = {}
        Array.from(el.attributes).forEach(attr => {
            attributes[attr.name] = attr.value
        })

        // Extract children (preserve order and duplicates)
        const children: Array<{ tagName: string }> = []
        Array.from(el.children).forEach(child => {
            children.push({ tagName: child.tagName })
        })

        // Extract ancestors
        const ancestors: string[] = []
        let parent = el.parentElement
        while (parent) {
            ancestors.push(parent.tagName)
            parent = parent.parentElement
        }

        // Extract descendants (all generic tags deep down)
        const descendants: string[] = []
        const allDescendants = el.getElementsByTagName('*')
        for (let i = 0; i < allDescendants.length; i++) {
            // use set to avoid duplicates? condition usually checks "exists", validValues maps to list.
            // Array from HTMLCollection
            descendants.push(allDescendants[i].tagName)
        }
        const uniqueDescendants = Array.from(new Set(descendants))

        return {
            tagName: el.tagName,
            children, // Real instances!
            attributes,
            textContent: el.textContent || '',
            parent: el.parentElement ? { tagName: el.parentElement.tagName } : null,
            ancestors,
            descendants: uniqueDescendants
        }
    }, [instances, selectedInstanceIndex])

    return {
        instances,
        selectedInstanceIndex,
        selectedInstanceData,
        setInstanceIndex: setSelectedInstanceIndex,
        loading,
        error,
        sourceFileName: file ? file.name : null
    }
}
