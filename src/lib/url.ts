import type { MessageKey } from '../i18n'

export type NormalizeResult =
  | { ok: true; url: string }
  | { ok: false; errorKey: MessageKey }

const HTTP_SCHEME = /^https?:\/\//i
// A scheme-like prefix whose colon is not followed by a digit (a digit means a port, e.g. example.com:8080)
const OTHER_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i

/**
 * Returns null for empty input (caller clears the preview without showing an error).
 */
export function normalizeUrl(input: string): NormalizeResult | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  let candidate = trimmed
  if (!HTTP_SCHEME.test(trimmed)) {
    if (OTHER_SCHEME.test(trimmed)) {
      return { ok: false, errorKey: 'error.unsupportedProtocol' }
    }
    candidate = `https://${trimmed}`
  }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, errorKey: 'error.invalidUrl' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, errorKey: 'error.unsupportedProtocol' }
  }
  if (!parsed.hostname.includes('.')) {
    return { ok: false, errorKey: 'error.invalidUrl' }
  }

  return { ok: true, url: parsed.href }
}
