export const zhTW = {
  'lang.switch': 'English',
  'meta.title': 'QR Code 產生器 | 網址轉 QR Code',
  'meta.description': '免費的網址 QR Code 產生器：輸入網址即可產生 QR Code，並下載 PNG 或 SVG。所有處理都在你的裝置上完成。',
  'app.title': 'QR Code 產生器',
  'app.description': '輸入網址，立即產生可下載的 QR Code',
  'input.label': '網址',
  'input.placeholder': 'example.com',
  'preview.alt': '網址的 QR Code',
  'preview.empty': '輸入網址後，QR Code 會顯示在這裡',
  'preview.encodedUrl': '實際編碼的網址',
  'download.format': '格式',
  'download.size': '尺寸',
  'download.vectorNote': '向量格式，不需選擇尺寸',
  'download.button': '下載',
  'error.invalidUrl': '網址格式不正確，請檢查後再試一次',
  'error.unsupportedProtocol': '只支援 http:// 或 https:// 開頭的網址',
  'warning.dense': '網址很長，QR Code 會很密集，可能不容易掃描。建議先縮短網址再產生',
  'notice.inAppBrowser': '在 LINE、Facebook 等 App 內建的瀏覽器中，下載可能無法使用，請改為長按上方圖片來儲存',
  'error.tooLong': '網址太長，無法產生 QR Code，請先縮短網址',
  'privacy.note': '所有處理都在你的裝置上完成，你輸入的網址不會被上傳',
} as const

export type MessageKey = keyof typeof zhTW
