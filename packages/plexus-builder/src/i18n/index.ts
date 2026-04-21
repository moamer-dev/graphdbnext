import { useModelBuilderStore } from '../stores/modelBuilderStore'
import en from './en.json'
import de from './de.json'

const messages: Record<string, any> = { en, de }

export function useBuilderTranslations() {
  const locale = useModelBuilderStore((state) => state.locale || 'en')
  const activeMessages = messages[locale] || messages.en

  return (key: string) => {
    const keys = key.split('.')
    let current = activeMessages
    for (const k of keys) {
      if (current[k] === undefined) return key
      current = current[k]
    }
    return current
  }
}
