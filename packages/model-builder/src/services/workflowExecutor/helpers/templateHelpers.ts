import { replaceExpressions } from '../../../utils/jsonPathExpression'

export function evaluateTemplate(value: string, apiResponseData: unknown): string {
  if (!value || !apiResponseData) return value
  if (value.includes('{{ $json.')) {
    const evaluated = replaceExpressions(value, { json: apiResponseData })
    return String(evaluated || value)
  }
  return value
}

