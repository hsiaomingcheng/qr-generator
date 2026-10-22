# QR Code Generator

A purely client-side URL to QR code generator: enter a URL, get a QR code instantly, and download it as a PNG (256 / 512 / 1024 / 2048 px) or an SVG. Available in Traditional Chinese and English.

- **Everything happens in the browser**: the URL you enter is never sent to any server, and no external QR code API is called.
- **No external CDN**: all libraries are installed from npm and bundled into the site.
- **Mobile first**: the preview is an `<img>`, so it can be long-pressed to save on a phone.

Built with Vite (vanilla-ts), TypeScript, [`qrcode`](https://www.npmjs.com/package/qrcode) and Vitest. See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the development plan.

## Run locally

Requires Node.js (see `.nvmrc` for the version).

```bash
npm install
npm run dev
```

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run dev -- --host` | Also serve on the local network, so a phone on the same Wi-Fi can open the address shown in the terminal |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run the unit tests |

## Deploy (Cloudflare Workers static assets)

The configuration is in [wrangler.jsonc](wrangler.jsonc); the site is the contents of `dist/`.

1. Push the project to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages**, create a new application, and import the GitHub repository.
3. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
4. After the first deployment you get a `*.workers.dev` URL. From then on, every push to `main` redeploys automatically.

You can also deploy manually (log in to Cloudflare first):

```bash
npm run build
npx wrangler deploy
```

### After deploying

The `og:image` tag in `index.html` must be an absolute URL for LINE and Facebook to show the link preview image. Once you know the live URL, change it to `https://<your-url>/og-image.png`.
