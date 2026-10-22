import QRCode from 'qrcode'
import type { MessageKey } from '../i18n'

export type QrResult =
  | { ok: true; dataUrl: string; dense: boolean }
  | { ok: false; errorKey: MessageKey }

// Version 10 (57 modules per side) and above gets hard to scan, so we warn the user.
const DENSE_MODULE_COUNT = 57

// Always black on white with a 4-module quiet zone: some scanners cannot read inverted codes.
const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
} as const

export type SvgResult =
  | { ok: true; svg: string }
  | { ok: false; errorKey: MessageKey }

export const PREVIEW_WIDTH = 512

export async function generateSvg(url: string): Promise<SvgResult> {
  try {
    // No width option: the SVG scales to any size.
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' })
    return { ok: true, svg }
  } catch {
    return { ok: false, errorKey: 'error.tooLong' }
  }
}

export async function generateQr(url: string, width: number = PREVIEW_WIDTH): Promise<QrResult> {
  try {
    const dense = QRCode.create(url, QR_OPTIONS).modules.size >= DENSE_MODULE_COUNT
    const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width })
    return { ok: true, dataUrl, dense }
  } catch {
    // The library throws when the data exceeds the capacity of the largest QR version.
    return { ok: false, errorKey: 'error.tooLong' }
  }
}
