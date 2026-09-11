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

  test('sorts discovered artwork deterministically by filename', async () => {
    const { galleryDir, biblioDir } = await makeContentTree();
    await Promise.all([
      writeFile(path.join(galleryDir, 'zeta.webp'), 'image'),
      writeFile(path.join(galleryDir, 'Alpha.webp'), 'image'),
      writeFile(path.join(galleryDir, 'middle.jpeg'), 'image'),
    ]);

    const items = await buildGalleryManifest({ galleryDir, biblioDir });

    expect(items.map((item) => item.id)).toEqual(['Alpha', 'middle', 'zeta']);
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
        JSON.stringify({ series: 'example', seriesOrder: 1 }),
      ),
      writeFile(
        path.join(biblioDir, '04-series-finish.json'),
        JSON.stringify({ series: 'example', seriesOrder: 2 }),
      ),
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
});
