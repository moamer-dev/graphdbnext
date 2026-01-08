import { toast } from 'sonner'
import { useLoading } from './useLoading'
import { useFileDownload } from './useFileDownload'

export function useHtml () {
  const { loading, withLoading } = useLoading()
  const { downloadHTML } = useFileDownload()

  const convertToHTML = async (mode: 'facsimile' | 'philology') => {
    await withLoading(async () => {
      try {
        const response = await fetch('/api/graph2html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        })

        const data = await response.json()

        if (data.success) {
          downloadHTML(data.html, `${mode}.html`)
          toast.success(`HTML conversion successful! Generated ${mode}.html`)
        } else {
          toast.error(data.error || 'Conversion failed')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed'
        toast.error(errorMessage)
      }
    })
  }

  return {
    loading,
    convertToHTML
  }
}

