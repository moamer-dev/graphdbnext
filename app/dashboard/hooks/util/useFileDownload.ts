import { useCallback } from 'react'

export function useFileDownload () {
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadJSON = useCallback((data: unknown, filename: string) => {
    downloadFile(JSON.stringify(data, null, 2), filename, 'application/json')
  }, [downloadFile])

  const downloadHTML = useCallback((html: string, filename: string) => {
    downloadFile(html, filename, 'text/html')
  }, [downloadFile])

  return {
    downloadFile,
    downloadJSON,
    downloadHTML
  }
}

