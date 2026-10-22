import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectLanguage,
  getLanguage,
  initLanguage,
  messages,
  readStoredLanguage,
  setLanguage,
  t,
} from '../src/i18n'

describe('messages', () => {
  it('has identical keys in both languages', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages['zh-TW']).sort())
  })

  it('has no empty strings', () => {
    for (const lang of Object.values(messages)) {
      for (const text of Object.values(lang)) expect(text.trim()).not.toBe('')
    }
  })
})

describe('detectLanguage', () => {
  it('picks zh-TW for Chinese locales', () => {
    expect(detectLanguage(['zh-TW'])).toBe('zh-TW')
    expect(detectLanguage(['zh-CN', 'en'])).toBe('zh-TW')
    expect(detectLanguage(['ZH-hant'])).toBe('zh-TW')
  })

  it('only looks at the first language', () => {
    expect(detectLanguage(['en-US', 'zh-TW'])).toBe('en')
    expect(detectLanguage(['zh-TW', 'en-US'])).toBe('zh-TW')
  })

  it('picks en for everything else', () => {
    expect(detectLanguage(['en-US'])).toBe('en')
    expect(detectLanguage(['ja', 'fr'])).toBe('en')
  })

  it('picks en when no languages are available', () => {
    expect(detectLanguage([])).toBe('en')
  })
})

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    data,
  }
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('language persistence', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('saves the chosen language and reads it back', () => {
    const storage = fakeStorage()
    vi.stubGlobal('localStorage', storage)
    setLanguage('en')
    expect(storage.data.lang).toBe('en')
    expect(readStoredLanguage()).toBe('en')
    expect(t('download.button')).toBe(messages.en['download.button'])
  })

  it('ignores an invalid stored value', () => {
    vi.stubGlobal('localStorage', fakeStorage({ lang: 'fr' }))
    expect(readStoredLanguage()).toBeNull()
  })

  it('initLanguage prefers the saved language over the browser language', () => {
    vi.stubGlobal('localStorage', fakeStorage({ lang: 'en' }))
    vi.stubGlobal('navigator', { languages: ['zh-TW'] })
    expect(initLanguage()).toBe('en')
  })

  it('initLanguage falls back to the browser language when nothing is saved', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    vi.stubGlobal('navigator', { languages: ['zh-TW'] })
    expect(initLanguage()).toBe('zh-TW')
  })

  it('does not break when localStorage throws', () => {
    vi.stubGlobal('localStorage', throwingStorage)
    vi.stubGlobal('navigator', { languages: ['en-US'] })
    expect(readStoredLanguage()).toBeNull()
    expect(() => setLanguage('zh-TW')).not.toThrow()
    expect(getLanguage()).toBe('zh-TW')
    expect(initLanguage()).toBe('en')
  })
})
