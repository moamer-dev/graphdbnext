import { useState, useEffect, useRef, startTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export type ViewType = 'nodes' | 'relations'

export function useUrlSync (initialView: ViewType, initialItem: string | null) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isInitialMount = useRef(true)
  const isUpdatingFromUrl = useRef(false)
  const prevViewRef = useRef<string | null>(null)
  const prevItemRef = useRef<string | null>(null)

  const [selectedType, setSelectedType] = useState<ViewType>(initialView)
  const [selectedItem, setSelectedItem] = useState<string | null>(initialItem)

  // Sync from URL params when they change (back/forward navigation)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevViewRef.current = searchParams.get('view')
      prevItemRef.current = searchParams.get('item')
      return
    }

    // Skip if we're updating from state (to avoid circular updates)
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false
      return
    }

    const viewFromUrl = searchParams.get('view') as ViewType | null
    const itemFromUrl = searchParams.get('item')

    if (prevViewRef.current !== viewFromUrl) {
      if (viewFromUrl === 'nodes' || viewFromUrl === 'relations') {
        isUpdatingFromUrl.current = true
        startTransition(() => {
          setSelectedType(viewFromUrl)
        })
      }
      prevViewRef.current = viewFromUrl
    }

    if (prevItemRef.current !== itemFromUrl) {
      isUpdatingFromUrl.current = true
      startTransition(() => {
        setSelectedItem(itemFromUrl || null)
      })
      prevItemRef.current = itemFromUrl
    }
  }, [searchParams])

  // Update URL when selections change
  useEffect(() => {
    if (isInitialMount.current) {
      return
    }

    // Skip if we're updating from URL (to avoid circular updates)
    if (isUpdatingFromUrl.current) {
      return
    }

    const currentView = searchParams.get('view')
    const currentItem = searchParams.get('item')

    const params = new URLSearchParams(searchParams.toString())

    if (selectedType === 'nodes') {
      params.delete('view')
    } else {
      params.set('view', selectedType)
    }

    if (selectedItem) {
      params.set('item', selectedItem)
    } else {
      params.delete('item')
    }

    const expectedView = selectedType === 'nodes' ? null : selectedType
    if (currentView !== expectedView || currentItem !== selectedItem) {
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [selectedType, selectedItem, router, searchParams])

  return { selectedType, setSelectedType, selectedItem, setSelectedItem }
}

