import { describe, expect, test } from 'vitest';

import { calculateTilt, loadGalleryManifest } from '../src/gallery.js';

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
