export const zhTW = {
  'app.title': 'QR Code 產生器',
  'app.description': '輸入網址，立即產生可下載的 QR Code',
  'input.label': '網址',
  'input.placeholder': 'example.com',
  'preview.alt': '網址的 QR Code',
  'preview.empty': '輸入網址後，QR Code 會顯示在這裡',
  'preview.encodedUrl': '實際編碼的網址',
  'download.png': '下載 PNG',
  'error.invalidUrl': '網址格式不正確，請檢查後再試一次',
  'error.unsupportedProtocol': '只支援 http:// 或 https:// 開頭的網址',
  'error.tooLong': '網址太長，無法產生 QR Code，請先縮短網址',
  'privacy.note': '所有處理都在你的裝置上完成，你輸入的網址不會被上傳',
} as const

export type MessageKey = keyof typeof zhTW
