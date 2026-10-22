import { afterEach, describe, expect, test, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildGalleryManifest } from '../scripts/build-gallery-manifest.mjs';

const temporaryRoots = [];

async function makeContentTree() {
  const root = await mkdtemp(path.join(tmpdir(), 'beewaker-gallery-'));
  temporaryRoots.push(root);

  const galleryDir = path.join(root, 'gallery');
  const biblioDir = path.join(root, 'biblio');
  await mkdir(galleryDir);
  await mkdir(biblioDir);

  return { galleryDir, biblioDir };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('buildGalleryManifest', () => {
  test('discovers supported artwork and humanizes its filename', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'forest-god.webp'), 'image');
    await writeFile(path.join(galleryDir, 'notes.txt'), 'ignore me');

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items).toEqual([
      {
        medium: '2d',
        mediaType: 'artwork',
        media: null,
        id: 'forest-god',
        title: 'Forest God',
        src: 'gallery/forest-god.webp',
        description: '',
        year: null,
        characters: [],
        backImage: null,
        credit: null,
      },
    ]);
  });

  test('marks an artwork as a 3D render only when its metadata requests it', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'room-render.webp'), 'image');
    await writeFile(
      path.join(biblioDir, 'room-render.json'),
      JSON.stringify({ medium: '3d' }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.medium).toBe('3d');
    expect(item.mediaType).toBe('scene');
  });

  test('normalizes a 3D turntable sequence without exposing source geometry', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, '413th-oc.webp'), 'image');
    await writeFile(
      path.join(biblioDir, '413th-oc.json'),
      JSON.stringify({
        medium: '3d',
        mediaType: 'turntable',
        media: {
          framePattern: 'turntables/413th/413th_{frame}.webp',
          frameCount: 48,
          startFrame: 0,
          framePadding: 4,
        },
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item).toMatchObject({
      medium: '3d',
      mediaType: 'turntable',
      media: {
        framePattern: 'turntables/413th/413th_{frame}.webp',
        frameCount: 48,
        startFrame: 0,
        framePadding: 4,
      },
    });
    expect(JSON.stringify(item)).not.toMatch(/blend|fbx|glb|texture/i);
  });

  test('normalizes a lazy video source for a motion entry', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'freezer-loop.webp'), 'image');
    await writeFile(
      path.join(biblioDir, 'freezer-loop.json'),
      JSON.stringify({
        medium: '3d',
        mediaType: 'video',
        media: { src: 'media/video/freezer-loop.mp4' },
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.mediaType).toBe('video');
    expect(item.media).toEqual({ src: 'media/video/freezer-loop.mp4' });
  });

  test('falls back to a still scene when media metadata contains an unsafe path', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'unsafe-video.webp'), 'image');
    await writeFile(
      path.join(biblioDir, 'unsafe-video.json'),
      JSON.stringify({
        medium: '3d',
        mediaType: 'video',
        media: { src: '../private/source.mp4' },
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.mediaType).toBe('scene');
    expect(item.media).toBeNull();
  });

  test('includes a linked character credit from artwork metadata', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'art-fight-attack.webp'), 'image');
    await writeFile(
      path.join(biblioDir, 'art-fight-attack.json'),
      JSON.stringify({
        credit: {
          label: 'Character by manipulatinglileye',
          url: 'https://artfight.net/~manipulatinglileye',
        },
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.credit).toEqual({
      label: 'Character by manipulatinglileye',
      url: 'https://artfight.net/~manipulatinglileye',
    });
  });

  test('rejects a character credit with an unsafe link protocol', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'unsafe-credit.webp'), 'image');
    await writeFile(
      path.join(biblioDir, 'unsafe-credit.json'),
      JSON.stringify({
        credit: {
          label: 'Unsafe credit',
          url: 'javascript:alert(1)',
        },
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.credit).toBeNull();
  });

  test('merges matching metadata and an explicit custom back image', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'bella.png'), 'image');
    await writeFile(path.join(biblioDir, 'bella-card.webp'), 'back');
    await writeFile(
      path.join(biblioDir, 'bella.json'),
      JSON.stringify({
        title: 'Bella',
        year: 2026,
        characters: ['Bella'],
        description: 'Commission work.',
        backImage: 'bella-card.webp',
      }),
    );

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item).toMatchObject({
      id: 'bella',
      title: 'Bella',
      year: 2026,
      characters: ['Bella'],
      description: 'Commission work.',
      backImage: 'biblio/bella-card.webp',
    });
  });

  test('auto-detects a basename-back image when metadata does not specify one', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'knight.jpg'), 'image');
    await writeFile(path.join(biblioDir, 'knight-back.png'), 'back');

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.backImage).toBe('biblio/knight-back.png');
  });

  test('falls back to defaults when matching metadata is invalid', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await writeFile(path.join(galleryDir, 'red_signal.avif'), 'image');
    await writeFile(path.join(biblioDir, 'red_signal.json'), '{broken');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const [item] = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(item.title).toBe('Red Signal');
    expect(warning).toHaveBeenCalledOnce();
  });

  test('sorts discovered 2D artwork deterministically by newest filename first', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, 'zeta.webp'), 'image'),
      writeFile(path.join(galleryDir, 'Alpha.webp'), 'image'),
      writeFile(path.join(galleryDir, 'middle.jpeg'), 'image'),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual(['zeta', 'middle', 'Alpha']);
  });

  test('shows newer numbered 2D artworks before older ones regardless of category', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, '01-original.webp'), 'image'),
      writeFile(path.join(galleryDir, '02-fan-art.webp'), 'image'),
      writeFile(path.join(galleryDir, '03-commission.webp'), 'image'),
      writeFile(
        path.join(biblioDir, '01-original.json'),
        JSON.stringify({ category: 'oc' }),
      ),
      writeFile(
        path.join(biblioDir, '02-fan-art.json'),
        JSON.stringify({ category: 'fanart' }),
      ),
      writeFile(
        path.join(biblioDir, '03-commission.json'),
        JSON.stringify({ category: 'commissions' }),
      ),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual([
      '03-commission',
      '02-fan-art',
      '01-original',
    ]);
  });

  test('uses explicit portfolio order for 2D artworks before filename fallback', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, '01-first-file.webp'), 'image'),
      writeFile(path.join(galleryDir, '02-second-file.webp'), 'image'),
      writeFile(path.join(galleryDir, '03-third-file.webp'), 'image'),
      writeFile(
        path.join(biblioDir, '01-first-file.json'),
        JSON.stringify({ portfolioOrder: 2 }),
      ),
      writeFile(
        path.join(biblioDir, '02-second-file.json'),
        JSON.stringify({ portfolioOrder: 3 }),
      ),
      writeFile(
        path.join(biblioDir, '03-third-file.json'),
        JSON.stringify({ portfolioOrder: 1 }),
      ),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual([
      '02-second-file',
      '01-first-file',
      '03-third-file',
    ]);
    expect(items.every((item) => !('portfolioOrder' in item))).toBe(true);
  });

  test('keeps artworks from the same series together without changing filename ids', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, '01-opening.webp'), 'image'),
      writeFile(path.join(galleryDir, '02-series-sketch.webp'), 'image'),
      writeFile(path.join(galleryDir, '03-standalone.webp'), 'image'),
      writeFile(path.join(galleryDir, '04-series-finish.webp'), 'image'),
      writeFile(path.join(galleryDir, '05-closing.webp'), 'image'),
      writeFile(
        path.join(biblioDir, '02-series-sketch.json'),
        JSON.stringify({ medium: '3d', series: 'example', seriesOrder: 1 }),
      ),
      writeFile(
        path.join(biblioDir, '04-series-finish.json'),
        JSON.stringify({ medium: '3d', series: 'example', seriesOrder: 2 }),
      ),
      writeFile(path.join(biblioDir, '01-opening.json'), JSON.stringify({ medium: '3d' })),
      writeFile(path.join(biblioDir, '03-standalone.json'), JSON.stringify({ medium: '3d' })),
      writeFile(path.join(biblioDir, '05-closing.json'), JSON.stringify({ medium: '3d' })),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual([
      '01-opening',
      '02-series-sketch',
      '04-series-finish',
      '03-standalone',
      '05-closing',
    ]);
  });

  test('orders invisible portfolio categories as original works, fan art, then commissions', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, '01-commission.webp'), 'image'),
      writeFile(path.join(galleryDir, '02-fan-art.webp'), 'image'),
      writeFile(path.join(galleryDir, '03-original.webp'), 'image'),
      writeFile(
        path.join(biblioDir, '01-commission.json'),
        JSON.stringify({ medium: '3d', category: 'commissions' }),
      ),
      writeFile(
        path.join(biblioDir, '02-fan-art.json'),
        JSON.stringify({ medium: '3d', category: 'fanart' }),
      ),
      writeFile(
        path.join(biblioDir, '03-original.json'),
        JSON.stringify({ medium: '3d', category: 'oc' }),
      ),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual(['03-original', '02-fan-art', '01-commission']);
    expect(items.every((item) => !('category' in item))).toBe(true);
  });
});
