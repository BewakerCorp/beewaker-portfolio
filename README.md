# Beewaker Art Archive

[Open the live portfolio](https://bewakercorp.github.io/beewaker-portfolio/)

A lightweight artwork portfolio with a masonry gallery and a two-sided 3D inspection view. The site is built with Vite and Three.js and published automatically through GitHub Pages.

## Add an artwork

1. Prepare a web copy. Use WebP where possible, keep the long edge around 1,800–2,000 px, strip EXIF metadata, and aim for roughly 0.5–1 MB or less.
2. Put it in `public/gallery`, for example `public/gallery/forest-god.webp`.
3. Optionally add `public/biblio/forest-god.json` using the same basename:

   ```json
   {
     "title": "Forest God",
     "year": 2026,
     "characters": ["Character name"],
     "description": "Text shown on the reverse side."
   }
   ```

4. Optionally put a custom reverse image in `public/biblio/forest-god-back.webp`. It is detected automatically. You can also name another supported image in the JSON with `"backImage": "filename.webp"`.
5. Commit the files to `main`. GitHub Actions regenerates the gallery manifest and republishes the site.

If the JSON is absent or invalid, the artwork still appears with a title derived from its filename and the standard information back.

Supported artwork formats are WebP, AVIF, PNG, JPG, and JPEG. Do not store PSDs, layered source files, or full-resolution masters in this repository.

## Local development

Requires Node.js 20.19 or newer.

```bash
npm ci
npm run dev
```

Run the checks and production build:

```bash
npm test
npm run build
```

`npm run build` first scans `public/gallery` and `public/biblio`, writes `public/gallery-manifest.json`, and then creates the deployable site in `dist`.

## Image protection

The site suppresses ordinary image dragging, context menus, and direct full-size image presentation in the inspector. These are deterrents only. Any pixels delivered to a browser can still be extracted through developer tools or captured in a screenshot, so the repository intentionally contains web derivatives rather than valuable originals.

## Copyright and use

Copyright © 2026 Beewaker / BewakerCorp. All rights reserved.

The website code, design, text, artwork, and renders may not be copied, reposted, modified, distributed, sold, or used for artificial-intelligence or machine-learning systems without prior written permission. Rights in third-party characters remain with their respective owners. See the [LICENSE](LICENSE) file for the complete terms.
