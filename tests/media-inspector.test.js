import { describe, expect, test } from 'vitest';

import {
  frameIndexFromDrag,
  framePath,
  getInspectorMode,
  getInspectorModeHint,
  normalizeFrameIndex,
  prefetchOrder,
  resolveMediaAsset,
} from '../src/media-inspector.js';

describe('turntable frame addressing', () => {
  const media = {
    framePattern: 'turntables/413th/413th_{frame}.webp',
    frameCount: 48,
    startFrame: 0,
    framePadding: 4,
  };

  test('pads and inserts frame numbers into the public pattern', () => {
    expect(framePath(media, 0)).toBe('turntables/413th/413th_0000.webp');
    expect(framePath(media, 7)).toBe('turntables/413th/413th_0007.webp');
    expect(framePath(media, 47)).toBe('turntables/413th/413th_0047.webp');
  });

  test('wraps frame indexes in either direction', () => {
    expect(normalizeFrameIndex(-1, 48)).toBe(47);
    expect(normalizeFrameIndex(48, 48)).toBe(0);
    expect(normalizeFrameIndex(49, 48)).toBe(1);
  });

  test('maps horizontal dragging to frame steps', () => {
    expect(frameIndexFromDrag({ startIndex: 10, deltaX: 24, pixelsPerFrame: 8, frameCount: 48 })).toBe(13);
    expect(frameIndexFromDrag({ startIndex: 1, deltaX: -24, pixelsPerFrame: 8, frameCount: 48 })).toBe(46);
  });

  test('prefetches nearest neighboring frames before distant ones', () => {
    const order = prefetchOrder(0, 8);
    expect(order.slice(0, 5)).toEqual([0, 1, 7, 2, 6]);
    expect(new Set(order).size).toBe(8);
  });
});

describe('media inspector modes', () => {
  test.each([
    [{ mediaType: 'turntable' }, 'turntable'],
    [{ mediaType: 'scene' }, 'still'],
    [{ mediaType: 'video' }, 'video'],
    [{ mediaType: 'artwork' }, 'artwork'],
    [{}, 'artwork'],
  ])('maps gallery metadata to a viewer mode', (item, expected) => {
    expect(getInspectorMode(item)).toBe(expected);
  });

  test.each([
    ['turntable', 'DRAG / SWIPE ROTATE · ARROW KEYS STEP · SLIDER SCRUB'],
    ['still', 'FULL RESOLUTION RENDER'],
    ['video', 'MUTED LOOP · USE PLAYER CONTROLS'],
  ])('provides mode-specific footer guidance', (mode, expected) => {
    expect(getInspectorModeHint(mode)).toBe(expected);
  });

  test('resolves media relative to the deployed GitHub Pages base', () => {
    expect(resolveMediaAsset('/beewaker-portfolio/', 'media/video/freezer.mp4')).toBe(
      '/beewaker-portfolio/media/video/freezer.mp4',
    );
    expect(resolveMediaAsset('/beewaker-portfolio', 'gallery/poster.webp')).toBe(
      '/beewaker-portfolio/gallery/poster.webp',
    );
  });
});
