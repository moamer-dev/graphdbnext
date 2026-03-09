import { replaceExpressions } from '../../../utils/jsonPathExpression'

export function evaluateTemplate(value: string, apiResponseData: unknown, xmlElement?: Element): string {
  if (!value) return value
  
  let result = value

  // Handle XML attributes: {{ @attr }}
  if (xmlElement && result.includes('{{ @')) {
    const attrRegex = /\{\{\s*@([^}]+)\s*\}\}/g
    result = result.replace(attrRegex, (match, attrName) => {
      const val = xmlElement.getAttribute(attrName.trim())
      return val !== null ? val : match
    })
  }

  // Handle JSON: {{ $json.path }}
  if (apiResponseData && result.includes('{{ $json.')) {
    result = replaceExpressions(result, { json: apiResponseData })
  }
  
  return result
}

