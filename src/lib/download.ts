import { generateQr, generateSvg } from './qr'

export const DEFAULT_PNG_SIZE = 1024

// Hostnames can be up to 253 characters; keep filenames at a sane length.
const MAX_DOMAIN_LENGTH = 50

/**
 * PNG: qrcode_<domain>_<size>.png, SVG: qrcode_<domain>.svg
 * Non-alphanumeric characters in the domain become "-". Non-ASCII domains are
 * already punycode (xn--...) because the URL comes from new URL().href.
 */
export function buildFilename(url: string, format: 'png' | 'svg', size?: number): string {
  const domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-').slice(0, MAX_DOMAIN_LENGTH)
  return format === 'png' ? `qrcode_${domain}_${size}.png` : `qrcode_${domain}.svg`
}

// Revoking right after the click makes Safari and Firefox fail or save an empty file.
const REVOKE_DELAY_MS = 10_000

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS)
}

/**
 * Regenerates the QR code at the requested size and downloads it.
 * Returns false when the QR code cannot be generated.
 */
export async function downloadPng(
  url: string,
  width: number = DEFAULT_PNG_SIZE,
  filename = 'qrcode.png',
): Promise<boolean> {
  const result = await generateQr(url, width)
  if (!result.ok) return false

  const blob = await (await fetch(result.dataUrl)).blob()
  triggerDownload(blob, filename)
  return true
}

/** Returns false when the QR code cannot be generated. */
export async function downloadSvg(url: string, filename = 'qrcode.svg'): Promise<boolean> {
  const result = await generateSvg(url)
  if (!result.ok) return false

  triggerDownload(new Blob([result.svg], { type: 'image/svg+xml' }), filename)
  return true
}
