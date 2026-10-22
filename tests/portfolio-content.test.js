import { describe, expect, test } from 'vitest';
import path from 'node:path';

import { buildGalleryManifest } from '../scripts/build-gallery-manifest.mjs';

describe('published portfolio content', () => {
  test('shows Blood Stone — Sword Form first in the 2D gallery', async () => {
    const publicDir = path.resolve('public');
    const items = await buildGalleryManifest({
      galleryDir: path.join(publicDir, 'gallery'),
      biblioDir: path.join(publicDir, 'biblio'),
    });

    const first2dArtwork = items.find((item) => item.medium === '2d');

    expect(first2dArtwork).toMatchObject({
      id: '36-blood-stone-sword-form',
      title: 'Blood Stone — Sword Form',
      year: 2026,
    });
  });
});
