// Best-effort only: it cannot cover every app. Long-press-to-save on the <img> is the real fallback.
// \b keeps "Line/" from matching inside other tokens such as "Baseline/".
const IN_APP_BROWSER = /\bLine\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger/i

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER.test(userAgent)
}
