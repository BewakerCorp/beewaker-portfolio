# 3D Media Archive Implementation Plan

**Goal:** Add optimized character turntables, still renders, and animation loops to the existing portfolio without exposing source 3D assets.

**Architecture:** Keep the generated gallery manifest as the content API. Extend its metadata schema with media types and media-specific fields, render nested 3D subsections from that manifest, and let the existing inspector dialog dispatch to artwork, turntable, still, or video viewers.

**Stack:** Vite, vanilla JavaScript, CSS, Three.js for the existing 2D artwork-card inspector, Vitest, FFmpeg/WebP asset processing.

---

## Task 1: Extend gallery metadata and grouping

**Files:**
- Modify: `scripts/build-gallery-manifest.mjs`
- Modify: `src/gallery.js`
- Modify: `tests/build-gallery-manifest.test.js`
- Modify: `tests/gallery.test.js`

1. Add failing tests for normalized `turntable`, `scene`, and `video` metadata.
2. Add failing tests for `CHARACTERS / 360°`, `SCENES`, and `MOTION` grouping.
3. Implement backward-compatible media type normalization; existing records default to artwork.
4. Implement 3D subtype grouping while keeping the existing top-level 2D/3D grouping.
5. Run focused manifest and gallery tests.

## Task 2: Add media-aware gallery cards

**Files:**
- Modify: `src/gallery.js`
- Modify: `src/styles.css`
- Modify: `tests/gallery.test.js`
- Modify: `tests/layout-css.test.js`

1. Add failing tests for per-type action labels and nested subsection output.
2. Render a separate grid for each 3D subtype.
3. Add unobtrusive badges/actions: rotate, inspect scene, play loop.
4. Style subsections and wide media cards responsively without changing 2D artwork layout.
5. Run focused gallery/layout tests.

## Task 3: Add turntable and media inspector modes

**Files:**
- Modify: `index.html`
- Modify: `src/inspector.js`
- Create: `src/media-inspector.js`
- Modify: `src/styles.css`
- Modify: `tests/inspector.test.js`
- Create: `tests/media-inspector.test.js`

1. Add failing tests for frame path calculation, frame wrapping, input/drag mapping, control labels, and cleanup.
2. Add a turntable view using an image sequence, pointer/touch dragging, keyboard arrows, and a range input.
3. Prefetch neighboring frames and progressively warm the remaining sequence.
4. Add a still-image viewer for 16:9 renders.
5. Add a muted looping video viewer that loads only after selection and tears down on close.
6. Switch the inspector footer controls based on the active media type while preserving the existing Three.js artwork-card viewer.
7. Run inspector tests.

## Task 4: Process and add portfolio media

**Files:**
- Create: `public/turntables/413th/*.webp`
- Create: `public/turntables/sunny/*.webp`
- Create: `public/turntables/gribobas/*.webp`
- Create: `public/media/scenes/*.webp`
- Create: `public/media/video/*.mp4`
- Create: `public/gallery/26-*.webp` through the new 3D poster entries
- Create: matching `public/biblio/*.json`

1. Convert only frames `0000`–`0047` from each sequence to transparent WebP.
2. Optimize four scene renders to WebP.
3. Normalize all three videos to web-compatible H.264 MP4 with `faststart` and no audio track.
4. Generate lightweight poster images.
5. Add the supplied character titles and descriptions to metadata.
6. Add neutral descriptive titles to scene and motion entries; mark Tesla as an image-plane/compositing study.
7. Rebuild the manifest and inspect generated paths.

## Task 5: Verify responsive behavior and performance

**Files:**
- Modify as needed: `src/styles.css`, `src/media-inspector.js`, tests

1. Run the complete test suite.
2. Run the production build.
3. Launch the built site locally and smoke-test desktop and mobile widths.
4. Confirm that gallery cards do not fetch full video files before selection.
5. Confirm keyboard, pointer, and touch-compatible turntable controls.
6. Check asset totals and remove source/redundant files from the publish tree.

## Task 6: Commit and publish

1. Review the final diff and repository status.
2. Commit implementation and optimized assets.
3. Push `main` to GitHub Pages.
4. Verify the public portfolio loads and the new 3D archive is reachable.
