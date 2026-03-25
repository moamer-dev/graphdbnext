import { toast } from 'sonner'

/**
 * Utility function to download schema templates
 * Extracted from page component for reusability
 */
export function downloadTemplate (type: 'md' | 'json') {
  const link = document.createElement('a')
  link.href = `/templates/schema-template.${type}`
  link.download = `schema-template.${type}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success(`Template downloaded: schema-template.${type}`)
}

