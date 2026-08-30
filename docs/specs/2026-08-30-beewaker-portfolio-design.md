# Beewaker Portfolio — Design Specification

## Goal

Create a lightweight public portfolio for Beewaker's character-focused dark fantasy and horror artwork. The site is a gallery and presentation surface only: it does not process commissions, payments, accounts, or uploads.

## Primary flow

1. A visitor opens the landing screen and sees a short introduction plus `Portfolio` and `Social Networks` choices.
2. `Portfolio` reveals a masonry gallery that preserves each artwork's aspect ratio and keeps a fixed gap between cards.
3. Moving the pointer across a card produces a restrained perspective tilt.
4. Selecting a card opens a game-like inspection overlay.
5. The artwork can be rotated freely as a two-sided object. The front is the artwork; the back is either a generated grey information panel or an optional custom image.
6. The overlay closes with its close button, Escape, or a click outside the inspection panel.

## MVP scope

- One static page with landing, portfolio, and social sections.
- Hash-based section navigation so GitHub Pages does not need route fallbacks.
- Responsive CSS-column masonry gallery.
- Lazy-loaded thumbnails and keyboard-accessible artwork buttons.
- Subtle pointer-driven gallery-card tilt on pointer devices.
- Three.js inspection overlay with front/back textures and inertial drag rotation.
- Close via button, Escape, or backdrop; reset via double-click.
- Content discovered at build time from `public/gallery` and paired metadata in `public/biblio`.
- GitHub Actions workflow that builds and deploys to GitHub Pages.
- Empty, loading, and texture-error states.

## Deferred scope

- Character/year/tag filters.
- Folder views.
- Custom cursor.
- Social links arranged as a literal web.
- Administration panel and browser-based uploads.
- Payments or commission ordering.

## Content convention

Artwork and metadata share a basename:

```text
public/gallery/forest-god.webp
public/biblio/forest-god.json
public/biblio/forest-god-back.webp  # optional
```

Metadata schema:

```json
{
  "title": "Forest God",
  "year": 2026,
  "characters": ["Character name"],
  "description": "Text shown on the back of the card.",
  "backImage": "forest-god-back.webp"
}
```

All fields are optional. Missing metadata produces a humanized filename as the title and a blank/default information back. Future filter fields are stored now so adding filter controls does not require a metadata migration.

## Image protection and storage

Absolute download prevention is impossible for browser-visible pixels. The site therefore deters casual saving and avoids exposing valuable source files:

- Repository contains web derivatives only, never PSDs, layered files, or full-resolution masters.
- Recommended long edge is 1,800–2,000 px, WebP format, with an approximate target of 0.5–1.0 MB per artwork.
- Browser dragging, selection, and the context menu are suppressed over artwork surfaces.
- The inspection view uses a WebGL texture rather than a direct full-size image element.
- Existing artist signatures remain visible.
- Metadata is stripped from prepared web files.

These measures do not prevent DevTools extraction or screenshots and must not be described as DRM.

## Build and deployment

- Vite builds the static site with base path `/beewaker-portfolio/`.
- A prebuild Node script scans `public/gallery`, reads matching JSON files from `public/biblio`, and writes `public/gallery-manifest.json`.
- Invalid individual metadata files are reported and fall back to defaults without breaking the whole gallery.
- A GitHub Actions Pages workflow installs locked dependencies, runs the production build, uploads `dist`, and deploys it.
- The source repository and published site stay well below 1 GB by storing only web derivatives and not committing generated caches or `node_modules`.

## Visual direction

The site should feel like a restrained game archive or inspection interface rather than a conventional white portfolio template. Use near-black and dried-blood surfaces, muted grey-green text, thin technical borders, slightly distressed typography, and low-amplitude motion. Artwork remains the strongest colour on the page. Avoid generic neon cyberpunk, large rounded SaaS cards, and excessive glitch effects.

## Accessibility and input

- All navigation and gallery entries are real buttons or links.
- Focus states are visible.
- The inspection overlay has dialog semantics and restores focus to the selected card on close.
- Escape closes the overlay.
- Touch drag rotates the inspection card; hover tilt is disabled where hover is unavailable.
- Reduced-motion users receive static gallery cards and no inertial animation.

