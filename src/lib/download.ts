import { generateQr } from './qr'

export const DEFAULT_PNG_SIZE = 1024

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
