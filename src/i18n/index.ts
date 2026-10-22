import { en } from './en'
import { zhTW, type MessageKey } from './zh-TW'

export type { MessageKey }
export type Lang = 'zh-TW' | 'en'

export const messages: Record<Lang, Record<MessageKey, string>> = { 'zh-TW': zhTW, en }

const STORAGE_KEY = 'lang'

/** zh-TW if the first (highest-priority) language starts with "zh", otherwise en. */
export function detectLanguage(languages: readonly string[]): Lang {
  return languages[0]?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
}

function isLang(value: unknown): value is Lang {
  return value === 'zh-TW' || value === 'en'
}

// localStorage can throw or be missing (private mode, blocked site data): treat that as "not saved".
export function readStoredLanguage(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

function saveLanguage(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // not saved; the choice still applies for this page view
  }
}

let currentLang: Lang = 'zh-TW'

export function getLanguage(): Lang {
  return currentLang
}

/** Picks the saved language, else the browser's. Call once at startup. */
export function initLanguage(): Lang {
  currentLang = readStoredLanguage() ?? detectLanguage(navigator.languages ?? [])
  return currentLang
}

export function setLanguage(lang: Lang): void {
  currentLang = lang
  saveLanguage(lang)
}

export function t(key: MessageKey): string {
  return messages[currentLang][key]
}
