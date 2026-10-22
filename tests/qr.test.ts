import { describe, expect, it } from 'vitest'
import { generateQr, generateSvg } from '../src/lib/qr'

describe('generateQr', () => {
  it('returns a PNG data URL for a normal URL', async () => {
    const result = await generateQr('https://example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('returns error.tooLong when the URL exceeds QR capacity', async () => {
    const result = await generateQr(`https://example.com/${'a'.repeat(3000)}`)
    expect(result).toEqual({ ok: false, errorKey: 'error.tooLong' })
  })
})

describe('generateSvg', () => {
  it('returns an SVG string with a black-on-white palette', async () => {
    const result = await generateSvg('https://example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.svg).toMatch(/^<svg /)
      expect(result.svg).toContain('#000000')
      expect(result.svg).toContain('#ffffff')
    }
  })

  it('returns error.tooLong when the URL exceeds QR capacity', async () => {
    const result = await generateSvg(`https://example.com/${'a'.repeat(3000)}`)
    expect(result).toEqual({ ok: false, errorKey: 'error.tooLong' })
  })
})
