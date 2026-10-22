import '@fontsource-variable/bricolage-grotesque/wght.css'
import './style.css'
import { getLanguage, initLanguage, setLanguage, t, type MessageKey } from './i18n'
import { normalizeUrl } from './lib/url'
import { generateQr } from './lib/qr'
import { isInAppBrowser } from './lib/inAppBrowser'
import { DEFAULT_PNG_SIZE, buildFilename, downloadPng, downloadSvg } from './lib/download'

const DEBOUNCE_MS = 300
const PNG_SIZES = [256, 512, 1024, 2048]

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="page">
    <header>
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="subtitle" data-i18n="app.description"></p>
      </div>
      <button id="lang-switch" type="button" class="lang-switch" data-i18n-aria-label="lang.switch">
        <span data-l="zh-TW" aria-hidden="true">中</span><span data-l="en" aria-hidden="true">EN</span>
      </button>
    </header>

    <div class="workspace">
      <div class="field area-input">
        <label for="url-input" data-i18n="input.label"></label>
        <input
          id="url-input"
          type="text"
          inputmode="url"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          autocomplete="off"
          data-i18n-placeholder="input.placeholder"
        />
      </div>

      <div class="msgs area-msgs">
        <p id="message" class="message" aria-live="polite"></p>
        <p id="warning" class="message warning" aria-live="polite"></p>
      </div>

      <section class="preview area-proof">
        <div class="frame">
          <div id="label" class="label">
            <svg id="ghost" class="ghost" viewBox="0 0 29 29" aria-hidden="true" focusable="false">
              <g fill="none" stroke="currentColor" stroke-width="1">
                <rect x="0.5" y="0.5" width="6" height="6" />
                <rect x="22.5" y="0.5" width="6" height="6" />
                <rect x="0.5" y="22.5" width="6" height="6" />
              </g>
              <g fill="currentColor">
                <rect x="2" y="2" width="3" height="3" />
                <rect x="24" y="2" width="3" height="3" />
                <rect x="2" y="24" width="3" height="3" />
                <path d="M9 1h2v1H9zM12 2h1v2h-1zM14 0h2v1h-2zM17 3h2v1h-2zM9 5h1v2H9zM11 7h2v1h-2zM15 6h1v1h-1zM18 6h2v2h-2zM1 9h2v1H1zM4 10h1v2H4zM7 9h1v2H7zM9 9h2v1H9zM13 9h3v1h-3zM18 9h1v3h-1zM21 9h2v1h-2zM25 10h3v1h-3zM0 13h1v2H0zM3 13h2v1H3zM7 12h1v3H7zM10 11h1v2h-1zM12 12h2v1h-2zM16 11h1v2h-1zM20 12h1v1h-1zM23 12h1v3h-1zM26 13h2v1h-2zM2 16h1v1H2zM5 16h2v1H5zM9 14h2v2H9zM13 15h1v2h-1zM15 14h2v1h-2zM19 15h2v1h-2zM22 15h1v2h-1zM25 16h1v2h-1zM28 15h1v2h-1zM1 18h3v1H1zM6 18h1v2H6zM9 17h1v3H9zM12 18h2v1h-2zM16 17h1v2h-1zM18 18h2v1h-2zM22 19h2v1h-2zM26 19h2v1h-2zM9 22h2v1H9zM12 21h1v2h-1zM14 23h2v1h-2zM17 21h2v1h-2zM20 22h1v2h-1zM22 22h2v1h-2zM25 22h1v2h-1zM27 24h1v2h-1zM9 25h1v2H9zM11 26h2v1h-2zM14 25h1v3h-1zM17 24h2v1h-2zM17 27h3v1h-3zM21 25h2v2h-2zM24 27h2v1h-2z" />
              </g>
            </svg>
            <img id="qr-image" class="qr-image" data-i18n-alt="preview.alt" hidden />
            <span class="scan" aria-hidden="true"></span>
          </div>
        </div>
        <p id="empty-hint" class="empty-hint" data-i18n="preview.empty"></p>
        <div id="result" hidden>
          <p class="encoded"><span data-i18n="preview.encodedUrl"></span><code id="encoded-url"></code></p>
        </div>
      </section>

      <p id="in-app-notice" class="notice area-notice" data-i18n="notice.inAppBrowser" role="note" hidden></p>

      <div class="options area-options">
        <div class="field">
          <label for="format-select" data-i18n="download.format"></label>
          <select id="format-select">
            <option value="png" selected>PNG</option>
            <option value="svg">SVG</option>
          </select>
        </div>
        <div class="field" id="size-field">
          <label for="size-select" data-i18n="download.size"></label>
          <select id="size-select">
            ${PNG_SIZES.map((s) => `<option value="${s}"${s === DEFAULT_PNG_SIZE ? ' selected' : ''}>${s} px</option>`).join('')}
          </select>
        </div>
        <p id="vector-note" class="vector-note" data-i18n="download.vectorNote" hidden></p>
      </div>

      <button id="download" class="area-download" type="button" data-i18n="download.button" disabled></button>
    </div>

    <footer><p data-i18n="privacy.note"></p></footer>
  </main>
`

const input = app.querySelector<HTMLInputElement>('#url-input')!
const message = app.querySelector<HTMLParagraphElement>('#message')!
const warning = app.querySelector<HTMLParagraphElement>('#warning')!
const emptyHint = app.querySelector<HTMLParagraphElement>('#empty-hint')!
const result = app.querySelector<HTMLDivElement>('#result')!
const qrImage = app.querySelector<HTMLImageElement>('#qr-image')!
const label = app.querySelector<HTMLDivElement>('#label')!
const ghost = app.querySelector<SVGElement>('#ghost')!
const encodedUrl = app.querySelector<HTMLElement>('#encoded-url')!
const downloadButton = app.querySelector<HTMLButtonElement>('#download')!
const formatSelect = app.querySelector<HTMLSelectElement>('#format-select')!
const sizeSelect = app.querySelector<HTMLSelectElement>('#size-select')!
const sizeField = app.querySelector<HTMLDivElement>('#size-field')!
const vectorNote = app.querySelector<HTMLParagraphElement>('#vector-note')!
const langSwitch = app.querySelector<HTMLButtonElement>('#lang-switch')!

let currentUrl: string | null = null
let debounceTimer: number | undefined
let updateId = 0
let errorKey: MessageKey | null = null
let isDense = false

function showError(key: MessageKey | null): void {
  errorKey = key
  message.textContent = key ? t(key) : ''
}

function showWarning(dense: boolean): void {
  isDense = dense
  warning.textContent = dense ? t('warning.dense') : ''
}

// Re-renders every piece of text, so switching language never touches the input or the preview.
function applyLanguage(): void {
  document.documentElement.lang = getLanguage()
  document.title = t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))

  for (const el of app.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as MessageKey)
  }
  for (const el of app.querySelectorAll<HTMLElement>('[data-i18n-placeholder]')) {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder as MessageKey))
  }
  for (const el of app.querySelectorAll<HTMLElement>('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel as MessageKey))
  }
  for (const el of app.querySelectorAll<HTMLElement>('[data-i18n-alt]')) {
    el.setAttribute('alt', t(el.dataset.i18nAlt as MessageKey))
  }
  showError(errorKey)
  showWarning(isDense)
}

function clearPreview(): void {
  currentUrl = null
  showWarning(false)
  result.hidden = true
  emptyHint.hidden = false
  qrImage.hidden = true
  ghost.removeAttribute('hidden')
  downloadButton.disabled = true
}

async function update(showErrors: boolean): Promise<void> {
  const id = ++updateId
  const normalized = normalizeUrl(input.value)

  if (!normalized) {
    clearPreview()
    showError(null)
    return
  }
  if (!normalized.ok) {
    clearPreview()
    showError(showErrors ? normalized.errorKey : null)
    return
  }

  const qr = await generateQr(normalized.url)
  if (id !== updateId) return // a newer update superseded this one

  if (!qr.ok) {
    clearPreview()
    showError(showErrors ? qr.errorKey : null)
    return
  }

  const firstCode = result.hidden
  currentUrl = normalized.url
  qrImage.src = qr.dataUrl
  encodedUrl.textContent = normalized.url
  result.hidden = false
  emptyHint.hidden = true
  qrImage.hidden = false
  ghost.setAttribute('hidden', '')
  // One scan sweep when a code first appears; not on every edit, which would be noisy while typing.
  if (firstCode) label.classList.add('scanning')
  downloadButton.disabled = false
  showError(null)
  showWarning(qr.dense)
}

input.addEventListener('input', () => {
  showError(null)
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => void update(false), DEBOUNCE_MS)
})

input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return
  window.clearTimeout(debounceTimer)
  void update(true)
})

input.addEventListener('blur', () => {
  window.clearTimeout(debounceTimer)
  void update(true)
})

formatSelect.addEventListener('change', () => {
  const isSvg = formatSelect.value === 'svg'
  sizeField.hidden = isSvg
  vectorNote.hidden = !isSvg
})

downloadButton.addEventListener('click', () => {
  if (!currentUrl) return
  if (formatSelect.value === 'svg') {
    void downloadSvg(currentUrl, buildFilename(currentUrl, 'svg'))
  } else {
    const size = Number(sizeSelect.value)
    void downloadPng(currentUrl, size, buildFilename(currentUrl, 'png', size))
  }
})

label.addEventListener('animationend', () => label.classList.remove('scanning'))

langSwitch.addEventListener('click', () => {
  setLanguage(getLanguage() === 'zh-TW' ? 'en' : 'zh-TW')
  applyLanguage()
})

// The preview is always an <img>, so long-press-to-save works whether or not we detect an in-app browser.
app.querySelector<HTMLParagraphElement>('#in-app-notice')!.hidden = !isInAppBrowser(navigator.userAgent)

initLanguage()
applyLanguage()
