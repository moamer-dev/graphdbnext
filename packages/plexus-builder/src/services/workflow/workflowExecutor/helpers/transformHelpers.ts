export interface Transform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex' | 'slugify' | 'pascalcase' | 'camelcase' | 'snakecase'
  [key: string]: unknown
  replaceFrom?: string
  replaceTo?: string
  regexPattern?: string
  regexReplacement?: string
}

export function applyTransforms(text: string, transforms: Transform[]): string {
  let result = text
  transforms.forEach(transform => {
    switch (transform.type) {
      case 'lowercase':
        result = result.toLowerCase()
        break
      case 'uppercase':
        result = result.toUpperCase()
        break
      case 'trim':
        result = result.trim()
        break
      case 'slugify':
        result = result.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
        break
      case 'pascalcase':
        result = result
          .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
          .replace(/[^a-zA-Z0-9]/g, '')
          .replace(/^(.)/, (m, chr) => chr.toUpperCase())
        break
      case 'camelcase':
        result = result
          .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
          .replace(/[^a-zA-Z0-9]/g, '')
          .replace(/^(.)/, (m, chr) => chr.toLowerCase())
        break
      case 'snakecase':
        result = result
          .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
        break
      case 'replace': {
        const replaceFrom = transform.replaceFrom || ''
        const replaceTo = transform.replaceTo || ''
        if (replaceFrom) {
          result = result.replace(new RegExp(replaceFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceTo)
        }
        break
      }
      case 'regex': {
        const pattern = transform.regexPattern || ''
        const replacement = transform.regexReplacement || ''
        if (pattern) {
          try {
            const regex = new RegExp(pattern, 'g')
            result = result.replace(regex, replacement)
          } catch {
            // Keep current value on regex error
          }
        }
        break
      }
    }
  })
  return result
}

