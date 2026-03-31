export interface Transform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex' | 'slugify' | 'pascalcase' | 'camelcase' | 'snakecase' | 'date' | 'datetime' | 'year' | 'timestamp' | 'number' | 'boolean'
  [key: string]: unknown
  replaceFrom?: string
  replaceTo?: string
  regexPattern?: string
  regexReplacement?: string
}

export function applyTransforms(text: string, transforms: Transform[]): string {
  let result = text
  transforms.forEach(transform => {
    if (!result) return
    switch (transform.type) {
      case 'date': {
        const d = new Date(result)
        if (!isNaN(d.getTime())) {
          result = d.toISOString().split('T')[0]
        }
        break
      }
      case 'datetime': {
        const d = new Date(result)
        if (!isNaN(d.getTime())) {
          result = d.toISOString().replace('T', ' ').split('.')[0].slice(0, 16)
        }
        break
      }
      case 'year': {
        const d = new Date(result)
        if (!isNaN(d.getTime())) {
          result = d.getFullYear().toString()
        }
        break
      }
      case 'timestamp': {
        const d = new Date(result)
        if (!isNaN(d.getTime())) {
          result = Math.floor(d.getTime() / 1000).toString()
        }
        break
      }
      case 'number': {
        const num = parseFloat(result.replace(/[^0-9.-]/g, ''))
        if (!isNaN(num)) {
          result = num.toString()
        }
        break
      }
      case 'boolean': {
        const val = result.toLowerCase().trim()
        const isTrue = val === 'true' || val === '1' || val === 'yes' || val === 'on'
        result = isTrue ? 'true' : 'false'
        break
      }
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

