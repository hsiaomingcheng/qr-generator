import './style.css'
import { t, type MessageKey } from './i18n'
import { normalizeUrl } from './lib/url'
import { generateQr } from './lib/qr'
import { DEFAULT_PNG_SIZE, buildFilename, downloadPng, downloadSvg } from './lib/download'

const DEBOUNCE_MS = 300
const PNG_SIZES = [256, 512, 1024, 2048]

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="page">
    <header>
      <h1>${t('app.title')}</h1>
      <p class="subtitle">${t('app.description')}</p>
    </header>

    <div class="field">
      <label for="url-input">${t('input.label')}</label>
      <input
        id="url-input"
        type="text"
        inputmode="url"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        autocomplete="off"
        placeholder="${t('input.placeholder')}"
      />
    </div>

    <p id="message" class="message" aria-live="polite"></p>

    <section class="preview">
      <p id="empty-hint" class="empty-hint">${t('preview.empty')}</p>
      <div id="result" hidden>
        <img id="qr-image" class="qr-image" alt="${t('preview.alt')}" />
        <p class="encoded"><span>${t('preview.encodedUrl')}</span><code id="encoded-url"></code></p>
      </div>
    </section>

    <div class="options">
      <div class="field">
        <label for="format-select">${t('download.format')}</label>
        <select id="format-select">
          <option value="png" selected>PNG</option>
          <option value="svg">SVG</option>
        </select>
      </div>
      <div class="field" id="size-field">
        <label for="size-select">${t('download.size')}</label>
        <select id="size-select">
          ${PNG_SIZES.map((s) => `<option value="${s}"${s === DEFAULT_PNG_SIZE ? ' selected' : ''}>${s} px</option>`).join('')}
        </select>
      </div>
      <p id="vector-note" class="vector-note" hidden>${t('download.vectorNote')}</p>
    </div>

    <button id="download" type="button" disabled>${t('download.button')}</button>

    <footer><p>${t('privacy.note')}</p></footer>
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

let currentUrl: string | null = null
let debounceTimer: number | undefined
let updateId = 0

function showError(key: MessageKey | null): void {
  message.textContent = key ? t(key) : ''
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
