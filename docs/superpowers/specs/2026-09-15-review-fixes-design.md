# Portfolio Review Fixes Design

## Scope

Apply the verified technical and presentation fixes from the September 14 review while preserving the site's established archive design.

## Preserve

- Custom cursor, social web, scanlines, archive HUD, numbered doors, empty entrance screen, and 3D card interaction.
- Static commissions page with the illustrated price sheet, Discord contact, Boosty payment link, and no order form.
- Clickable crossed-out Commissions.gg link.
- Existing artwork titles, artwork selection, sketches, and inspector copy.

## Implement now

- Repair inspector status/error lifecycle, WebGL cleanup, Enter-to-flip behavior, hash navigation close, and mobile title visibility.
- Repair mobile commission overflow, gallery live-region behavior, progressive image loading, and hidden social-web animation.
- Remove TikTok tracking query parameters and replace internal `old/new` labels with public account handles.
- Add a favicon, Apple touch icon, Open Graph image, canonical URL, and share metadata.
- Add a concise third-party-character rights notice to the rendered site.
- Clarify that client permissions agreed for commissioned work override the repository license for that specific artwork.

## Deferred or excluded

- Commission ordering rules and Boosty instructions are deferred until the technical work is complete.
- Artwork descriptions and character records are deferred long-term.
- Artwork titles and gallery membership must not be changed.
- The separate `bewakercorp.github.io` root site must not be changed or redirected.

## Acceptance

- Existing and new automated tests pass.
- Production build succeeds.
- Mobile layout keeps the commission price sheet and headings inside the viewport.
- Keyboard controls retain normal button semantics: Enter activates the focused control, and the default focused Flip control flips the card.
- Social sharing metadata resolves to repository-local assets under the GitHub Pages base path.
