import QRCode from 'qrcode'
import type { MessageKey } from '../i18n'

export type QrResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: MessageKey }

// Always black on white with a 4-module quiet zone: some scanners cannot read inverted codes.
const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
} as const

export const PREVIEW_WIDTH = 512

export async function generateQr(url: string, width: number = PREVIEW_WIDTH): Promise<QrResult> {
  try {
    const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width })
    return { ok: true, dataUrl }
  } catch {
    // The library throws when the data exceeds the capacity of the largest QR version.
    return { ok: false, errorKey: 'error.tooLong' }
  }
}
