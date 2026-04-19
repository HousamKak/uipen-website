# UIpen — marketing site

Static one-page site for UIpen. Zero build step, zero dependencies.

## Preview locally

```sh
# any static server works; pick one:
npx serve D:/dev/uipen-website
# or
python -m http.server --directory D:/dev/uipen-website 4000
# or
bunx serve D:/dev/uipen-website
```

Open http://localhost:3000 (or whatever port your server reports).

## Deploy

Drop the folder into any static host — Cloudflare Pages, Netlify, Vercel, GitHub Pages, S3, whatever. Only three files ship:

- `index.html`
- `styles.css`
- `script.js`
- `assets/favicon.svg`

Everything else (fonts) loads from Google Fonts at runtime.

## Design notes

- **Style**: Bento grid (per ui-ux-pro-max recommendation) with varied card spans for feature showcase.
- **Type**: JetBrains Mono for headings and UI micro-type, IBM Plex Sans for body. Developer-tool mood.
- **Accent**: `#5E6AD2` indigo — deliberately matches the UIpen overlay's own accent so the brand reads as one thing across the product and its marketing surface.
- **Motion**: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) with `160 / 280 / 520ms` duration tiers. `prefers-reduced-motion` respected.
- **Demo**: pure CSS mockup of UIpen in action — no screenshots, no images, no screenshots-that-will-go-stale. Animated pin markers at 500ms / 900ms / 1300ms stagger.

## Editing

- Copy lives in `index.html`. Keep headings under ~10 words and bodies under ~30 to preserve rhythm.
- Swap `href="https://github.com"` for the actual UIpen repo URL once it's public.
- The install section has 4 framework tabs — add more by duplicating a `.pane` block and adding a `.tab` button.
