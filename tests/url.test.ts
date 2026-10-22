import { describe, expect, it } from 'vitest'
import { normalizeUrl } from '../src/lib/url'

const ok = (url: string) => ({ ok: true, url })
const err = (errorKey: string) => ({ ok: false, errorKey })

describe('normalizeUrl', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('   \n\t ')).toBeNull()
  })

  it('prepends https:// when no scheme is given', () => {
    expect(normalizeUrl('example.com')).toEqual(ok('https://example.com/'))
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toEqual(ok('https://example.com/'))
  })

  it('keeps http:// and https://', () => {
    expect(normalizeUrl('http://example.com')).toEqual(ok('http://example.com/'))
    expect(normalizeUrl('https://example.com')).toEqual(ok('https://example.com/'))
  })

  it('accepts an uppercase scheme', () => {
    expect(normalizeUrl('HTTPS://Example.com')).toEqual(ok('https://example.com/'))
  })

  it('treats host:port as a host, not a scheme', () => {
    expect(normalizeUrl('example.com:8080/path')).toEqual(ok('https://example.com:8080/path'))
  })

  it('rejects other schemes', () => {
    expect(normalizeUrl('mailto:a@example.com')).toEqual(err('error.unsupportedProtocol'))
    expect(normalizeUrl('javascript:alert(1)')).toEqual(err('error.unsupportedProtocol'))
    expect(normalizeUrl('ftp://example.com')).toEqual(err('error.unsupportedProtocol'))
  })

  it('rejects a hostname without a dot', () => {
    expect(normalizeUrl('abc')).toEqual(err('error.invalidUrl'))
    expect(normalizeUrl('https://localhost')).toEqual(err('error.invalidUrl'))
  })

  it('rejects input that new URL() cannot parse', () => {
    expect(normalizeUrl('http://')).toEqual(err('error.invalidUrl'))
    expect(normalizeUrl('exa mple.com')).toEqual(err('error.invalidUrl'))
  })

  it('converts a non-ASCII domain to punycode', () => {
    expect(normalizeUrl('中文.tw')).toEqual(ok('https://xn--fiq228c.tw/'))
  })

  it('preserves query parameters and fragments', () => {
    expect(normalizeUrl('example.com/search?q=a&lang=zh#top')).toEqual(
      ok('https://example.com/search?q=a&lang=zh#top'),
    )
  })
})
