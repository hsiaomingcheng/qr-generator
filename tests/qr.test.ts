import { describe, expect, it } from 'vitest'
import { generateQr } from '../src/lib/qr'

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
