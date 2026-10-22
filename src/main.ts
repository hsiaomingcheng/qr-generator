import './style.css'
import { getLanguage, initLanguage, setLanguage, t, type MessageKey } from './i18n'
import { normalizeUrl } from './lib/url'
import { generateQr } from './lib/qr'
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
      <button id="lang-switch" type="button" class="lang-switch" data-i18n="lang.switch"></button>
    </header>

    <div class="field">
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

    <p id="message" class="message" aria-live="polite"></p>

    <section class="preview">
      <p id="empty-hint" class="empty-hint" data-i18n="preview.empty"></p>
      <div id="result" hidden>
        <img id="qr-image" class="qr-image" data-i18n-alt="preview.alt" />
        <p class="encoded"><span data-i18n="preview.encodedUrl"></span><code id="encoded-url"></code></p>
      </div>
    </section>

    <div class="options">
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

    <button id="download" type="button" data-i18n="download.button" disabled></button>

    <footer><p data-i18n="privacy.note"></p></footer>
  </main>
`

const input = app.querySelector<HTMLInputElement>('#url-input')!
const message = app.querySelector<HTMLParagraphElement>('#message')!
const emptyHint = app.querySelector<HTMLParagraphElement>('#empty-hint')!
const result = app.querySelector<HTMLDivElement>('#result')!
const qrImage = app.querySelector<HTMLImageElement>('#qr-image')!
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

function showError(key: MessageKey | null): void {
  errorKey = key
  message.textContent = key ? t(key) : ''
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
  for (const el of app.querySelectorAll<HTMLElement>('[data-i18n-alt]')) {
    el.setAttribute('alt', t(el.dataset.i18nAlt as MessageKey))
  }
  showError(errorKey)
}

function clearPreview(): void {
  currentUrl = null
  result.hidden = true
  emptyHint.hidden = false
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

  currentUrl = normalized.url
  qrImage.src = qr.dataUrl
  encodedUrl.textContent = normalized.url
  result.hidden = false
  emptyHint.hidden = true
  downloadButton.disabled = false
  showError(null)
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

langSwitch.addEventListener('click', () => {
  setLanguage(getLanguage() === 'zh-TW' ? 'en' : 'zh-TW')
  applyLanguage()
})

initLanguage()
applyLanguage()
