import { describe, expect, test } from 'vitest';

import {
  calculateHorizontalMasonry,
  calculateTilt,
  galleryImageAttributes,
  getGalleryColumnCount,
  loadGalleryManifest,
} from '../src/gallery.js';
import * as galleryModule from '../src/gallery.js';

describe('getGalleryColumnCount', () => {
  test.each([
    [1400, 4],
    [1200, 3],
    [900, 3],
    [800, 2],
    [600, 2],
    [560, 1],
    [320, 1],
  ])('uses %i columns at a %ipx viewport', (viewportWidth, expected) => {
    expect(getGalleryColumnCount(viewportWidth)).toBe(expected);
  });
});

describe('calculateHorizontalMasonry', () => {
  test('fills each visual row from left to right while keeping masonry packing', () => {
    expect(
      calculateHorizontalMasonry({
        containerWidth: 860,
        columnCount: 4,
        gap: 20,
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 30,
        paddingLeft: 20,
        itemHeights: [100, 200, 150, 120, 90, 80],
      }),
    ).toEqual({
      columnWidth: 190,
      height: 350,
      positions: [
        { column: 0, left: 20, top: 20 },
        { column: 1, left: 230, top: 20 },
        { column: 2, left: 440, top: 20 },
        { column: 3, left: 650, top: 20 },
        { column: 0, left: 20, top: 140 },
        { column: 1, left: 230, top: 240 },
      ],
    });
  });
});

describe('calculateTilt', () => {
  test('returns no rotation at the card center', () => {
    expect(calculateTilt({ x: 50, y: 100, width: 100, height: 200 }, 5)).toEqual({
      rotateX: -0,
      rotateY: 0,
    });
  });

  test.each([
    [{ x: 0, y: 0, width: 100, height: 200 }, { rotateX: 5, rotateY: -5 }],
    [{ x: 100, y: 0, width: 100, height: 200 }, { rotateX: 5, rotateY: 5 }],
    [{ x: 0, y: 200, width: 100, height: 200 }, { rotateX: -5, rotateY: -5 }],
    [{ x: 100, y: 200, width: 100, height: 200 }, { rotateX: -5, rotateY: 5 }],
  ])('maps a card corner to bounded rotation', (rect, expected) => {
    expect(calculateTilt(rect, 5)).toEqual(expected);
  });

  test('returns no rotation for an invalid element size', () => {
    expect(calculateTilt({ x: 20, y: 20, width: 0, height: 0 }, 5)).toEqual({ rotateX: 0, rotateY: 0 });
  });
});

describe('galleryImageAttributes', () => {
  test('lazy-loads decorative thumbnails inside named artwork buttons', () => {
    expect(galleryImageAttributes?.()).toEqual({
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      draggable: false,
    });
  });
});

describe('gallery medium sections', () => {
  test('always creates separate 2D and 3D sections with independent item lists', () => {
    const drawing = { id: 'drawing', medium: '2d' };
    const render = { id: 'render', medium: '3d' };
    const legacyDrawing = { id: 'legacy' };

    expect(galleryModule.groupGalleryItems?.([drawing, render, legacyDrawing])).toEqual([
      { medium: '2d', title: '2D ART', emptyMessage: 'No 2D works have been added yet.', items: [drawing, legacyDrawing] },
      { medium: '3d', title: '3D RENDERS', emptyMessage: 'No 3D renders have been added yet.', items: [render] },
    ]);
  });

  test('keeps the empty 3D section visible before the first render is added', () => {
    expect(galleryModule.groupGalleryItems?.([{ id: 'drawing', medium: '2d' }])[1]).toEqual({
      medium: '3d',
      title: '3D RENDERS',
      emptyMessage: 'No 3D renders have been added yet.',
      items: [],
    });
  });
});

describe('loadGalleryManifest', () => {
  test('loads the manifest relative to the supplied base URL', async () => {
    const requestedUrls = [];
    const items = [{ id: 'one', src: 'gallery/one.webp' }];
    const fetcher = async (url) => {
      requestedUrls.push(url);
      return { ok: true, json: async () => items };
    };

    await expect(loadGalleryManifest('/beewaker-portfolio/', fetcher)).resolves.toEqual(items);
    expect(requestedUrls).toEqual(['/beewaker-portfolio/gallery-manifest.json']);
  });

  test('rejects unsuccessful manifest responses with a readable error', async () => {
    const fetcher = async () => ({ ok: false, status: 500 });

    await expect(loadGalleryManifest('/', fetcher)).rejects.toThrow('Unable to load gallery (500)');
  });

  test('rejects a manifest that is not an array', async () => {
    const fetcher = async () => ({ ok: true, json: async () => ({ items: [] }) });

    await expect(loadGalleryManifest('/', fetcher)).rejects.toThrow('Gallery manifest is invalid');
  });
});
