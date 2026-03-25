export function parsePropertyValue (value: string, type: 'string' | 'number' | 'boolean'): unknown {
  if (type === 'number') {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  return value
}
