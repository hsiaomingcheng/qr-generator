import type { MessageKey } from './zh-TW'

// Typed against zh-TW's keys so a missing or extra key is a compile error.
export const en: Record<MessageKey, string> = {
  'lang.switch': '中文',
  'meta.title': 'QR Code Generator | URL to QR Code',
  'meta.description': 'Free URL to QR code generator: enter a URL and download the QR code as PNG or SVG. Everything is processed on your device.',
  'app.title': 'QR Code Generator',
  'app.description': 'Enter a URL and instantly get a downloadable QR code',
  'input.label': 'URL',
  'input.placeholder': 'example.com',
  'preview.alt': 'QR code for the URL',
  'preview.empty': 'Your QR code will appear here after you enter a URL',
  'preview.encodedUrl': 'Encoded URL',
  'download.format': 'Format',
  'download.size': 'Size',
  'download.vectorNote': 'Vector format — no size needed',
  'download.button': 'Download',
  'error.invalidUrl': 'This URL looks invalid. Please check it and try again',
  'error.unsupportedProtocol': 'Only URLs starting with http:// or https:// are supported',
  'error.tooLong': 'This URL is too long to encode. Please shorten it first',
  'privacy.note': 'Everything is processed on your device; your URL is never uploaded',
}
