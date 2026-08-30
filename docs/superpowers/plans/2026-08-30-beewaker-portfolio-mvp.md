# Beewaker Portfolio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a GitHub Pages portfolio with a masonry gallery, file-driven content, and a two-sided 3D artwork inspector.

**Architecture:** Vite serves a single static page and uses hash navigation for the landing, gallery, and social views. A dependency-free Node prebuild script turns artwork files and optional JSON metadata into a manifest; the browser renders the gallery from that manifest and loads Three.js only for the inspector.

**Tech Stack:** Vite, vanilla JavaScript modules, Three.js, CSS, Node.js built-ins, Vitest, GitHub Actions Pages.

**Spec:** `docs/specs/2026-08-30-beewaker-portfolio-design.md`

## Global Constraints

- Deploy below `/beewaker-portfolio/` on GitHub Pages.
- Store only reduced WebP/JPEG/PNG web derivatives; never commit layered or full-resolution masters.
- Keep the MVP free of payments, authentication, uploads, filters, folders, and custom cursor behavior.
- Content lives in `public/gallery` and `public/biblio` and is discovered during the build.
- The inspector must close by button, Escape, or backdrop and must work with pointer and touch input.
- Use accessible native controls and honor reduced-motion preferences.

---

### Task 1: Project foundation and manifest generator

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.gitignore`
- Create: `scripts/build-gallery-manifest.mjs`
- Create: `tests/build-gallery-manifest.test.js`
- Create: `public/gallery/.gitkeep`
- Create: `public/biblio/.gitkeep`

**Interfaces:**
- Produces: `buildGalleryManifest({ galleryDir, biblioDir }) -> Promise<GalleryItem[]>`
- Produces: `public/gallery-manifest.json` before development and production builds.

- [ ] **Step 1: Write failing manifest tests**

Test discovery, filename humanization, matching JSON metadata, optional custom back images, deterministic sorting, and invalid JSON fallback using temporary directories.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/build-gallery-manifest.test.js`

Expected: failure because `scripts/build-gallery-manifest.mjs` does not exist.

- [ ] **Step 3: Implement the manifest generator**

Export `buildGalleryManifest`, accept injectable directories for tests, recognize `.webp`, `.png`, `.jpg`, `.jpeg`, and `.avif`, URI-encode public paths segment-by-segment, and write formatted JSON when the module is executed directly.

- [ ] **Step 4: Add Vite configuration and scripts**

Set `base` to `/beewaker-portfolio/`. Add `predev` and `prebuild` scripts for manifest generation, `dev`, `build`, `preview`, and `test` scripts, with exact versions for Vite, Vitest, and Three.js in the lockfile.

- [ ] **Step 5: Run tests and generate the manifest**

Run: `npm test`

Expected: all manifest tests pass.

Run: `npm run build:gallery`

Expected: the script creates `public/gallery-manifest.json`; the first complete Vite build runs after Task 2 supplies `index.html`.

### Task 2: Accessible shell and section navigation

**Files:**
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `src/navigation.js`
- Create: `tests/navigation.test.js`

**Interfaces:**
- Produces: `getSectionFromHash(hash) -> "home" | "portfolio" | "socials"`
- Produces: `navigateTo(section)` and `renderSection(section)` for the application shell.
- Consumes: base URL supplied by Vite through `import.meta.env.BASE_URL`.

- [ ] **Step 1: Write failing navigation tests**

Cover empty/unknown hashes, valid hashes, and normalization without needing a browser DOM.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/navigation.test.js`

Expected: failure because `src/navigation.js` does not exist.

- [ ] **Step 3: Implement navigation and application markup**

Create semantic `main` sections for home, portfolio, and socials; preserve the two requested primary choices; update the visible section on `hashchange`; set page title and descriptive metadata.

- [ ] **Step 4: Implement the core visual system**

Define the near-black/dried-blood palette, technical borders, square corners, responsive typography, visible focus styles, and reduced-motion rules. Keep artwork colour dominant and avoid decorative imagery.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`

Expected: tests pass and the static shell builds successfully.

### Task 3: File-driven masonry gallery and card tilt

**Files:**
- Create: `src/gallery.js`
- Create: `tests/gallery.test.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `loadGalleryManifest(baseUrl) -> Promise<GalleryItem[]>`
- Produces: `renderGallery(container, items, onSelect) -> void`
- Produces: `calculateTilt({ x, y, width, height }, maxDegrees) -> { rotateX, rotateY }`
- Consumes: generated `gallery-manifest.json`.

- [ ] **Step 1: Write failing pure-function tests**

Cover tilt at the center and four corners, and error normalization for failed manifest responses.

- [ ] **Step 2: Verify focused test failure**

Run: `npm test -- tests/gallery.test.js`

Expected: failure because `src/gallery.js` does not exist.

- [ ] **Step 3: Implement gallery loading and rendering**

Render each item as a keyboard-accessible button containing a lazy, async-decoded thumbnail. Provide loading, empty, and failure messages without inventing portfolio content.

- [ ] **Step 4: Implement masonry and pointer tilt**

Use responsive CSS columns with a fixed `1rem` gap and `break-inside: avoid`. Apply CSS custom properties from pointer position only for fine pointer/hover devices, and reset them on pointer leave.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`

Expected: gallery tests pass and the build contains the manifest loader.

### Task 4: Two-sided Three.js inspection overlay

**Files:**
- Create: `src/inspector.js`
- Create: `tests/inspector.test.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `createInspector(dialogElement) -> { open(item, trigger), close(), destroy() }`
- Produces: `fitCardDimensions(imageWidth, imageHeight, maxHeight) -> { width, height, depth }`
- Produces: generated canvas back texture when `item.backImage` is absent.
- Consumes: `GalleryItem` emitted by the manifest generator.

- [ ] **Step 1: Write failing dimension tests**

Cover portrait, landscape, square, and zero-dimension fallbacks.

- [ ] **Step 2: Verify focused test failure**

Run: `npm test -- tests/inspector.test.js`

Expected: failure because `src/inspector.js` does not exist.

- [ ] **Step 3: Implement dialog lifecycle**

Use a native `dialog`, close on the explicit button, cancel/Escape, and backdrop pointer-down. Restore focus to the triggering gallery card and lock page scrolling while open.

- [ ] **Step 4: Implement the 3D card**

Create a Three.js scene, orthographic camera, antialiased transparent renderer, and a thin box with separate front, back, and edge materials. Load the artwork as the front texture; use the optional back image or a generated grey information canvas for the back.

- [ ] **Step 5: Implement interaction and cleanup**

Map pointer/touch drag to unrestricted X/Y rotation, add reduced inertial velocity, reset on double-click, resize with the dialog, and dispose geometries, materials, textures, listeners, and animation frames on close/destroy.

- [ ] **Step 6: Run tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and Three.js is code-split into the production bundle.

### Task 5: Web artwork preparation and representative metadata

**Files:**
- Create: optimized artwork files under `public/gallery/`
- Create: matching JSON files under `public/biblio/`
- Modify: `public/gallery-manifest.json` through the generator only

**Interfaces:**
- Consumes: user-provided artwork attachments.
- Produces: web derivatives no larger than 2,000 px on the long edge, with source metadata stripped.

- [ ] **Step 1: Select representative supplied works**

Use the newest supplied pieces first and preserve their original aspect ratios and embedded signatures.

- [ ] **Step 2: Generate WebP derivatives**

Use an image conversion tool with metadata stripping and quality tuned to target approximately 0.5–1.0 MB per image. Do not modify or overwrite the supplied originals.

- [ ] **Step 3: Add minimal factual metadata**

Use only known titles/credits. When title, character, or description is unknown, omit the field instead of inventing it.

- [ ] **Step 4: Regenerate and validate manifest**

Run: `npm run build:gallery && npm test && npm run build`

Expected: each derivative appears once in the manifest and the build passes.

### Task 6: GitHub Pages deployment and handoff

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `README.md`

**Interfaces:**
- Produces: a Pages deployment from `dist` on pushes to `main` and manual dispatch.

- [ ] **Step 1: Add the official Pages workflow**

Grant `contents: read`, `pages: write`, and `id-token: write`; use concurrency group `pages`; checkout source, set up Node with npm caching, run `npm ci` and `npm run build`, configure Pages, upload `dist`, and deploy in the `github-pages` environment.

- [ ] **Step 2: Document the content workflow**

Explain basename matching, recommended image preparation, optional metadata and custom backs, local commands, and the fact that browser-visible images cannot be made impossible to extract.

- [ ] **Step 3: Run final verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: exit code 0 and a deployable `dist` directory.

- [ ] **Step 4: Commit and publish**

Commit the verified source to `main`, confirm the Pages workflow starts, and report any one-time repository setting the user must enable.
