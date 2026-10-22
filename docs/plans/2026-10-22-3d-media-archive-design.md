# 3D Media Archive Design

## Goal

Extend the existing portfolio with a coherent 3D archive that presents character turntables, still scene renders, and short animation loops without publishing source models, textures, rigs, or project files.

## Information architecture

Keep the existing `2D ART` section unchanged. Replace the currently empty flat `3D RENDERS` area with three subsections:

1. `CHARACTERS / 360°`
2. `SCENES`
3. `MOTION`

The subsections remain part of the current Portfolio screen so navigation and the site's visual language stay consistent.

## Character turntables

The character entries are:

- `413th OC`
- `Sunny OC rework`
- `Gribobas; Entity`

Each card uses frame `0000` as its thumbnail. Opening a card switches the existing inspector into a turntable mode:

- horizontal drag or swipe steps through 48 unique frames (`0000`–`0047`);
- a visible range control provides precise navigation and mobile accessibility;
- adjacent frames are prefetched while the full sequence loads progressively;
- reduced-motion preferences disable any optional automatic movement;
- character descriptions remain available in the inspector as an information panel.

Only optimized rendered frames are published. No `.blend`, `.fbx`, `.glb`, rig, geometry, or original texture assets are included.

## Scene renders

Four 16:9 still renders appear in a dedicated `SCENES` grid. They use the same card language as the rest of the portfolio and open in a still-image inspector mode sized for wide images.

Initial labels may remain descriptive and filename-derived until final project titles are supplied:

- `413th / Scene`
- `SIOS-1 Laboratory / Gribobas`
- `SIOS-1 Laboratory / Sunny`
- `SIOS-1 Laboratory / Sunny & 413th`

## Motion work

The motion entries are:

- `Freezer Loop`
- `Lights Off`
- `Tesla / Image-plane study`

Cards show generated poster frames. Videos do not autoplay in the gallery. On selection, the inspector opens an inline player that is muted and looped, with standard play/pause and seek controls. The Tesla entry is explicitly labeled as an image-plane/compositing study.

The square Tesla source is converted to a broadly supported web video format while retaining its original composition.

## Inspector behavior

The existing dialog remains the shared shell but receives media-specific modes:

- artwork card mode for existing 2D pieces;
- turntable mode for character sequences;
- still mode for 3D scene renders;
- video mode for motion work.

Controls and instructions change with the active mode. Closing the dialog stops video playback, cancels pending frame work, releases object URLs/listeners, and restores focus to the originating card.

## Data model

Gallery metadata gains an explicit item type and optional media fields. The generated manifest remains the single source of truth used by the gallery and inspector. Existing metadata continues to default to the current 2D artwork behavior for backward compatibility.

The 3D section groups entries by subtype (`character`, `scene`, `motion`) while the top-level grouping remains `2d` and `3d`.

## Performance and delivery

- Convert turntable PNG frames to optimized WebP assets with transparency preserved.
- Use only 48 unique frames to avoid a duplicate-frame pause at the loop seam.
- Generate compact thumbnails/posters for cards.
- Keep full video files lazy: they load only after selection.
- Respect `prefers-reduced-motion` and retain keyboard/touch operation.
- Preserve the current GitHub Pages/Vite deployment path.

## Verification

Automated tests cover manifest normalization, 3D subtype grouping, media-specific controls, turntable frame calculations, and cleanup behavior. The production build and existing test suite must pass. Desktop and mobile layouts receive a visual smoke test before publication.
