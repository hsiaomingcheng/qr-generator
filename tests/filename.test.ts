import { describe, expect, it } from 'vitest'
import { buildFilename } from '../src/lib/download'

describe('buildFilename', () => {
  it('builds a PNG filename with the size', () => {
    expect(buildFilename('https://www.example.com/', 'png', 1024)).toBe(
      'qrcode_www-example-com_1024.png',
    )
  })

  it('builds an SVG filename without a size', () => {
    expect(buildFilename('https://www.example.com/', 'svg')).toBe('qrcode_www-example-com.svg')
  })

  it('ignores port, path, query and fragment', () => {
    expect(buildFilename('https://example.com:8080/a/b?q=1#top', 'png', 256)).toBe(
      'qrcode_example-com_256.png',
    )
  })

  it('replaces special characters in the hostname with "-"', () => {
    expect(buildFilename('https://my_site.example.com/', 'svg')).toBe(
      'qrcode_my-site-example-com.svg',
    )
  })

  it('uses the punycode form for Chinese domains', () => {
    expect(buildFilename('https://xn--fiq228c.tw/', 'png', 512)).toBe(
      'qrcode_xn--fiq228c-tw_512.png',
    )
  })

  it('truncates very long domains', () => {
    const host = `${'a'.repeat(60)}.example.com`
    const name = buildFilename(`https://${host}/`, 'svg')
    expect(name).toBe(`qrcode_${'a'.repeat(50)}.svg`)
  })
})
