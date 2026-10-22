# QR Code Generator — Project Plan

> This document is the development reference for Claude Code. Place it in the repo root, and ask Claude Code to read it before starting each phase.
> Working project name: `qr-generator` (feel free to rename).

---

## 1. Project Goals

A purely client-side web tool: the user enters a URL → a QR code is generated instantly → the user downloads it as a PNG or SVG image.

**Core principles**

- **Everything happens in the browser**: the URL the user enters is never sent to any server, and no external QR code API is called.
- **No external CDN dependencies**: all libraries are installed via npm and bundled into the site itself.
- **Mobile first**: most people will use this on a phone, so the layout and download flow are designed for mobile first.
- **Simple and maintainable**: no front-end framework (React, Vue, etc.); plain TypeScript is enough.

## 2. Version 1 Scope

### Features to build

| Feature | Description |
|---|---|
| URL input | A single input field. Generates the QR code as the user types (with a ~300ms delay to avoid recalculating on every keystroke). Pressing Enter also triggers it |
| URL auto-cleanup | Trim leading/trailing whitespace; automatically add `https://` if the input doesn't start with `http://` or `https://` |
| URL validation | Show a clear error message when the format is invalid, and don't generate a QR code |
| QR code preview | Displayed as an `<img>` (not a canvas) so users can long-press to save it on mobile |
| Download PNG | Selectable sizes: 256 / 512 / 1024 / 2048 px, default 1024 |
| Download SVG | Vector format that stays sharp at any size, for printing |
| Language switch | Traditional Chinese / English, switchable at any time |
| Long URL warning | When the URL is so long that the QR code becomes very dense, warn the user it may be hard to scan and suggest shortening the URL first |
| In-app browser notice | When opened inside apps like LINE / Facebook / Instagram, show a notice: "Downloads may not work here — long-press the image to save it" |
| Privacy note | A short note on the page: "Everything is processed on your device; your URL is never uploaded" |

### Not in version 1 (to consider later)

- Custom colours, logo in the centre
- Ads and analytics (Google Analytics, etc.)
- Dynamic QR codes (changing the destination URL later, scan statistics) — these require a backend and are outside this project's scope
- Content other than URLs (Wi-Fi, phone numbers, email, plain text)
- Copying the image to the clipboard

## 3. Technology Choices

| Item | Choice | Reason |
|---|---|---|
| Build tool | Vite (`vanilla-ts` template) | Lightweight and fast; natively supported by Cloudflare |
| Language | TypeScript | Catches simple mistakes early; easier to maintain |
| QR code library | [`qrcode`](https://www.npmjs.com/package/qrcode) (node-qrcode) | Mature, MIT licensed, works in the browser, and can output both PNG (data URL) and SVG strings |
| Styling | Plain CSS (CSS custom properties) | The project is small; no CSS framework needed |
| Testing | Vitest | Integrates with Vite |
| Deployment | Cloudflare Workers (static assets) + automatic deployment from GitHub | See Section 8 |

> Claude Code: install the latest stable version of each package and lock versions in `package-lock.json`.

## 4. Detailed Specification

### 4.1 URL handling (`src/lib/url.ts`)

`normalizeUrl(input: string)` returns `{ ok: true, url: string } | { ok: false, errorKey: string }`

1. Trim leading/trailing whitespace. Empty string → don't show an error, just clear the preview.
2. Decide whether the input already has a scheme (protocol), using these rules (**important: do NOT simply check whether it starts with `xxx:`**, otherwise `example.com:8080` would be mistaken for a scheme called `example.com:`):
   - Starts with `http://` or `https://` (case-insensitive) → keep as is.
   - Matches `^[a-z][a-z0-9+.-]*:` and the character after the colon is **not** a digit (i.e. it isn't a port number) → treat as another scheme, e.g. `mailto:`, `javascript:` → `errorKey: "error.unsupportedProtocol"`.
   - Anything else (e.g. `example.com`, `example.com:8080/path`) → prepend `https://`.
3. Validate the format with the browser's built-in `new URL()`. If it throws → `errorKey: "error.invalidUrl"`.
4. After parsing, the protocol must be `http:` or `https:`; otherwise → `errorKey: "error.unsupportedProtocol"`.
5. The hostname must contain a `.` (e.g. rejects input like just `abc`) → `errorKey: "error.invalidUrl"`.
6. The content encoded in the QR code is `url.href` from the parsed `new URL()` (the most standard and compatible form). Show the "actual encoded URL" below the preview so the user can confirm it. Note two normal behaviours of `href` that should NOT be treated as bugs in tests:
   - `https://example.com` becomes `https://example.com/` (a trailing slash is added automatically).
   - Non-ASCII domains (e.g. Chinese) are converted to the `xn--` encoded form (punycode). This is the standard way to write such domains, and phones open them correctly after scanning.
7. **When to show error messages**: don't show errors while the user is still typing (e.g. when they've only typed `exam`) — just clear the preview. Show error messages only when the input loses focus (blur) or the user presses Enter; hide the error again as soon as the user edits the input.

### 4.2 QR code generation (`src/lib/qr.ts`)

- Error correction level: `M` (tolerates roughly 15% damage; suitable for general use).
- Quiet zone (white border): `margin: 4` (the QR code standard's recommended value; some scanners fail if it's narrower).
- Colours fixed to black foreground on white background. In dark mode, the QR code image must still be "black pattern on white background with a white border" — **never invert the colours**; many scanners can't read inverted QR codes.
- Preview: generate a PNG data URL and put it in an `<img>`.
- If the URL is too long, the library throws an error → show `error.tooLong`.
- Long URL warning: use `QRCode.create()` to get the module count (`modules.size`). When it's ≥ 57 (i.e. version 10 or above), show `warning.dense`.

### 4.3 Download (`src/lib/download.ts`)

- **PNG**: regenerate at the size the user selected (`width` option), convert to a Blob → `URL.createObjectURL` → create an `<a download>` and trigger the download → call `revokeObjectURL` **after a delay** (e.g. `setTimeout` of 10 seconds). Do NOT revoke immediately after the click — in Safari and Firefox this causes the download to fail or produce an empty file.
- **SVG**: use `QRCode.toString(url, { type: 'svg' })` to get the string → Blob (`image/svg+xml`) → same flow as above. SVG doesn't need a size option (when SVG is selected, hide the size selector or label it "Vector — size not needed").
- **Filename**: `qrcode_<domain>_<size>.png`; for SVG, `qrcode_<domain>.svg`. Replace any non-alphanumeric characters in the domain with `-`. Example: `qrcode_www-example-com_1024.png`.

### 4.4 In-app browser detection (`src/lib/inAppBrowser.ts`)

- Detect via User-Agent: `/\bLine\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger/i` (the `\b` prevents false matches on other UAs that happen to contain `line/`).
- This is best-effort only and can't cover every app — the long-press-to-save fallback (next point) is the real safety net.
- When detected, show a notice banner above the download button (`notice.inAppBrowser`).
- Whether detected or not, the preview is always an `<img>`, so long-press to save always works.

### 4.5 Internationalisation (`src/i18n/`)

- Files: `zh-TW.ts` and `en.ts`, both exporting objects with the same structure (use a TypeScript type to guarantee both have identical keys).
- Default language: if `navigator.languages` contains an entry starting with `zh` → `zh-TW`; otherwise `en`.
- When the user switches language, save it to `localStorage` (wrap reads and writes in `try/catch`; if it fails, treat it as not saved).
- When switching, also update `<html lang>`, the page title, and the `meta description`.
- Note: search engines and LINE/Facebook link previews **do not run JavaScript** — they only read what is hard-coded in `index.html`. So the `<title>`, `meta description`, and Open Graph tags in `index.html` must be written as fixed bilingual text (e.g. "QR Code 產生器 | URL to QR Code Generator"), not switched by JS.
- All on-screen text, error messages, and notices come from the language files. No hard-coded text in the code.

### 4.6 Page layout (top to bottom)

1. Title + one-line description + language switch button (top right)
2. URL input: use `type="text"` with `inputmode="url"` (shows the URL keyboard on mobile), plus `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, and a `<label>`. **Do NOT use `type="url"`** — the browser's built-in validation would reject input without `https://`, which conflicts with our "auto-add https://" design.
3. Error message / long URL warning area (`aria-live="polite"` so screen readers announce it)
4. QR code preview + "actual encoded URL"
5. In-app browser notice (only shown when detected)
6. Format selector (PNG / SVG) + size selector + download button
7. Privacy note (small text in the footer)

- Before any input, the preview area shows an empty-state hint, and the download button is disabled.
- At mobile width (~375px), use a single-column layout with no horizontal scrolling.
- Support dark mode (`prefers-color-scheme`), but keep the QR code image itself black and white.
- Every action must be doable with the keyboard; buttons have clear focus styles.

### 4.7 Basic SEO and sharing

- `<title>`, `meta description`, Open Graph tags (so links shared on LINE/Facebook show a title and preview image).
- A favicon.

## 5. Project Structure

```
qr-generator/
├── PROJECT_PLAN.md          ← this document
├── README.md                ← short description: purpose, how to run locally, how to deploy
├── .gitignore               ← at least node_modules/, dist/, .wrangler/
├── .nvmrc                   ← pins the Node.js version (current LTS) so local and Cloudflare builds match
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc           ← Cloudflare deployment config
├── public/
│   ├── favicon.svg
│   └── og-image.png         ← link preview image (1200×630). Use a simple placeholder for now; replace with a proper design later
├── src/
│   ├── main.ts              ← entry point; wires up page events
│   ├── style.css
│   ├── lib/
│   │   ├── url.ts
│   │   ├── qr.ts
│   │   ├── download.ts
│   │   └── inAppBrowser.ts
│   └── i18n/
│       ├── index.ts         ← language detection, switching, text lookup
│       ├── zh-TW.ts
│       └── en.ts
└── tests/
    ├── url.test.ts
    ├── filename.test.ts
    ├── inAppBrowser.test.ts
    └── i18n.test.ts
```

## 6. Development Phases

Finish and verify each phase before moving to the next. Commit at the end of each phase.
**Write unit tests alongside the features** (whatever file a phase creates, add its tests in the same phase) — don't leave them all to the end.

### Phase 0: Project setup
- Create a Vite `vanilla-ts` project **in the current folder** (it already contains `PROJECT_PLAN.md` — do not delete or overwrite it).
- Delete the template's sample files (e.g. the counter example and sample icons).
- Install `qrcode`, `@types/qrcode`, `vitest`, and `wrangler` (the last two as devDependencies), and add a `test` script to `package.json`.
- Create `.nvmrc`, `.gitignore`, `wrangler.jsonc`, and the folder structure above (empty files are fine).
- **Done when**: `npm run dev` opens a blank page, `npm run build` successfully produces `dist/`, and `npm test` runs (even with no tests yet).

### Phase 1: Core features
- Implement `url.ts` and `qr.ts`; typing a URL shows a live QR code preview.
- Download PNG (fixed at 1024px for now).
- Only write Traditional Chinese text for now, but **pull all text from the language file from the start** (makes Phase 3 easier).
- Tests: `url.test.ts`, covering at least: empty string, whitespace only, no scheme (`example.com`), `http://`, `https://`, uppercase `HTTPS://`, with a port (`example.com:8080/path`), `mailto:`, `javascript:`, hostname without a dot (`abc`), Chinese domain, URLs with query parameters and `#`.
- **Done when**: entering `example.com` generates a QR code; scanning the QR code on the computer screen with a phone camera opens `https://example.com/`; PNG download works; `npm test` passes.

### Phase 2: Download options
- PNG size selection, SVG download, filename rules.
- Tests: `filename.test.ts` (special characters, very long domains, Chinese domains).
- **Done when**: downloaded PNGs at all four sizes have the correct pixel dimensions; the SVG opened in a browser stays sharp when zoomed; `npm test` passes.

### Phase 3: Internationalisation
- Add the English language file, language detection, the switch button, and `localStorage` persistence.
- Tests: `i18n.test.ts` (both languages have identical keys; default language detection).
- **Done when**: switching language changes all text; the choice persists after a page reload; nothing breaks in private/incognito mode; `npm test` passes.

### Phase 4: User experience details
- Long URL warning, in-app browser notice, empty state, disabled button state, error message timing, dark mode, keyboard operation, mobile layout.
- SEO / Open Graph / favicon / placeholder `og-image.png`.
- Tests: `inAppBrowser.test.ts` (UAs for LINE, Facebook, Instagram, and regular iPhone Safari and Android Chrome).
- **Done when**: all "testable locally" items in the Section 7 checklist pass; `npm test` passes.
- To view the local dev site on a phone: run `npm run dev -- --host`, connect the phone to the same Wi-Fi, and open the local network address shown in the terminal.

### Phase 5: Deployment
- Deploy following Section 8, and write `README.md`.
- **Done when**: the site is publicly accessible via its URL, and pushing to `main` updates it automatically.

### Phase 6: Post-launch device testing
- Run the full Section 7 checklist on the live URL (LINE in-app browser, scanning on various phones, print tests, etc. — these need a public URL).
- Fix any issues found and redeploy.

## 7. Manual Testing Checklist

**Testable locally (Phase 4)**
- [ ] iPhone built-in camera successfully scans the QR code on screen
- [ ] Android camera (or Google Lens) successfully scans
- [ ] PNG and SVG downloads work in desktop Chrome / Firefox / Safari (files open and are not empty)
- [ ] A very long URL (200+ characters) shows the warning, and the generated QR code still scans
- [ ] No error messages pop up mid-typing; they only appear on blur or Enter
- [ ] In dark mode, the QR code is still a black pattern on a white background
- [ ] No horizontal scrolling at mobile width
- [ ] In the browser dev tools Network tab, confirm there are **no outgoing requests** when entering a URL

**Requires the live URL (Phase 6)**
- [ ] PNG and SVG downloads work in iPhone Safari and Android Chrome
- [ ] Opened inside LINE: the notice appears, and long-pressing the image saves it
- [ ] Pasting the site URL into LINE / Facebook shows a link preview with title and image
- [ ] A downloaded 2048px PNG printed at about 3cm × 3cm still scans
- [ ] The SVG imported into Word / print software stays sharp when enlarged

## 8. Deployment: Cloudflare

**Note**: Cloudflare currently recommends "Workers (static assets)" rather than "Pages" for new projects. Both are from Cloudflare, both are free, and both allow commercial use; for a purely static site they work the same. The difference is that Workers is where Cloudflare puts new features, while Pages remains supported but is unlikely to get new features. This project therefore uses Workers static assets.

### Config file `wrangler.jsonc`

```jsonc
{
  "name": "qr-generator",
  "compatibility_date": "<the date the project is created, e.g. 2026-10-22>",
  "assets": {
    "directory": "./dist"
  }
}
```

### Deployment steps (overview — Cloudflare's dashboard labels may differ slightly)

1. Push the project to GitHub (public or private repo — Cloudflare supports both).
2. Log in to the Cloudflare dashboard → **Workers & Pages** → create a new application → choose to import a repo from GitHub.
3. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
4. After deployment you'll get a `*.workers.dev` URL.
   (`wrangler` was installed as a devDependency in Phase 0, so `npx wrangler deploy` uses the project's locked version.)
5. From then on, every push to `main` redeploys automatically.

> If you'd rather stay on Cloudflare Pages: choose Pages when creating the app, set Framework preset to Vite, Build command `npm run build`, Output directory `dist`, and you won't need `wrangler.jsonc`. Everything else stays the same.

## 9. Possible Future Extensions

- Custom colours (needs a contrast check), logo in the centre (needs error correction raised to `H`)
- A custom domain (practically required if applying for Google AdSense later)
- Supporting article pages (e.g. "Recommended QR code print sizes") to add site content, which helps ad approval and search ranking
- Other QR code types such as Wi-Fi and business cards (vCard)

## 10. Example Prompt for Claude Code

When starting each phase, you can instruct Claude Code like this:

> Please read `PROJECT_PLAN.md` first, then complete "Phase 1: Core features". When you're done, tell me how to verify the "Done when" criteria. Don't implement features from other phases.
