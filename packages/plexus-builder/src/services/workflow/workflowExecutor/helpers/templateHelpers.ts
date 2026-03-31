import { replaceExpressions } from '../../../../utils/jsonPathExpression'

export function evaluateTemplate(value: string, apiResponseData: unknown, xmlElement?: Element): string {
  if (!value) return ''
  
  try {
    let result = String(value)

    // 1. Handle JSON expressions: {{ $json.path }} or {{ $json[0] }}
    if (apiResponseData && result.includes('{{ $json')) {
      result = replaceExpressions(result, { json: apiResponseData })
    }

    // 2. Handle XML attributes inside templates: {{ @attr }}
    if (xmlElement && typeof (xmlElement as any).getAttribute === 'function' && result.includes('{{ @')) {
      const attrRegex = /\{\{\s*@([^}]+)\s*\}\}/g
      result = result.replace(attrRegex, (match, attrName) => {
        const val = xmlElement.getAttribute(attrName.trim())
        return val !== null ? val : match
      })
    }
    
    // 3. Handle explicit attribute shorthands: @attr
    if (xmlElement && typeof (xmlElement as any).hasAttribute === 'function' && 
        result.startsWith('@') && !result.includes(' ') && !result.includes('{{')) {
      const attrName = result.substring(1)
      if (xmlElement.hasAttribute(attrName)) {
        return xmlElement.getAttribute(attrName) || ''
      }
      return '' // Shorthand used but attribute missing
    }

    // 4. Handle Implicit Attribute vs Literal logic
    // If it's a plain word (no spaces, no template), check if it matches an actual XML attribute.
    if (xmlElement && typeof (xmlElement as any).hasAttribute === 'function' && 
        result === String(value) && !result.includes(' ') && !result.includes('{{')) {
      if (xmlElement.hasAttribute(value)) {
        return xmlElement.getAttribute(value) || ''
      }
    }

    // DEFAULT: Return the literal result (e.g. "ahmed" or "test")
    return result
  } catch (err) {
    console.error('Error evaluating template:', err)
    return String(value)
  }
}
