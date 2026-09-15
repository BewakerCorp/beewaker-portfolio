# Portfolio Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved inspector, mobile, loading, social metadata, rights notice, and license fixes without changing the portfolio's product direction or artwork content.

**Architecture:** Preserve the existing Vite/Three.js single-page structure. Integrate the two review PRs selectively, amend keyboard focus semantics, keep presentation copy in `index.html`, and serve small static metadata assets from `public/`.

**Tech Stack:** Vite 7, vanilla JavaScript, Three.js 0.180, CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-review-fixes-design.md`

## Global Constraints

- Do not change artwork titles, gallery membership, sketches, or biblio descriptions.
- Preserve the custom cursor, social web, archive HUD, static commission flow, and crossed-out Commissions.gg node.
- Do not change or redirect the separate GitHub Pages root site.
- Keep the site deployable as a static GitHub Pages project.

---

### Task 1: Inspector lifecycle and keyboard controls

**Files:**
- Modify: `src/inspector.js`
- Modify: `src/main.js`
- Modify: `src/navigation.js`
- Test: `tests/inspector.test.js`
- Test: `tests/navigation.test.js`

**Interfaces:**
- Produces: status-preserving viewport reset, deterministic inspector cleanup, normal button keyboard semantics, and inspector close on location changes.

- [ ] Add failing tests for status preservation, cleanup, navigation close, default Flip focus, and Enter behavior on buttons.
- [ ] Run the focused tests and confirm they fail for the missing behavior.
- [ ] Implement the minimal lifecycle and keyboard changes.
- [ ] Run the focused tests and the complete suite.

### Task 2: Mobile, gallery, and social runtime fixes

**Files:**
- Modify: `index.html`
- Modify: `src/gallery.js`
- Modify: `src/main.js`
- Modify: `src/social-web.js`
- Modify: `src/styles.css`
- Test: `tests/commission-content.test.js`
- Test: `tests/gallery.test.js`
- Test: `tests/layout-css.test.js`
- Test: `tests/social-web.test.js`

**Interfaces:**
- Produces: progressive gallery reveal, scoped live regions, mobile-safe commission layout, and social animation only while visible.

- [ ] Add failing tests for lazy thumbnails, live-region placement, mobile title/overflow CSS, clean TikTok URLs, and social visibility gating.
- [ ] Run the focused tests and confirm they fail.
- [ ] Implement the minimal gallery, mobile, and social changes.
- [ ] Run the focused tests and the complete suite.

### Task 3: Visitor-facing labels and rights notices

**Files:**
- Modify: `src/social-web.js`
- Modify: `index.html`
- Modify: `LICENSE`
- Test: `tests/social-web.test.js`
- Test: `tests/commission-content.test.js`

**Interfaces:**
- Produces: public TikTok handle labels, an on-site third-party-character notice, and a commissioned-work license carve-out.

- [ ] Add failing assertions for the final labels and required rights text.
- [ ] Run the focused tests and confirm they fail.
- [ ] Add the approved visitor-facing and license copy.
- [ ] Run the focused tests and the complete suite.

### Task 4: Share metadata and static assets

**Files:**
- Modify: `index.html`
- Create: `public/favicon.svg`
- Create: `public/apple-touch-icon.png`
- Create: `public/social-card.svg`
- Create: `public/social-card.png`
- Create: `public/robots.txt`
- Test: `tests/metadata.test.js`

**Interfaces:**
- Produces: canonical and Open Graph metadata plus small repository-local share assets.

- [ ] Add a failing metadata test for canonical, Open Graph, icon, and robots declarations.
- [ ] Run the focused test and confirm it fails.
- [ ] Add branded static assets and matching metadata.
- [ ] Run the focused test, full suite, and production build.

### Task 5: Publish and verify

**Files:**
- Verify only.

**Interfaces:**
- Consumes: all preceding tasks.
- Produces: a tested commit on the repository's publishing branch.

- [ ] Run `npm test`, `npm run build`, and `git diff --check`.
- [ ] Review the final diff for excluded content changes.
- [ ] Commit the implementation and push the publishing branch.
- [ ] Confirm GitHub Pages deployment state and smoke-test the live site.
