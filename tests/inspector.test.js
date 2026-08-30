import { describe, expect, test } from 'vitest';

import { fitCardDimensions } from '../src/inspector.js';

describe('fitCardDimensions', () => {
  test('fits portrait artwork to the maximum span', () => {
    expect(fitCardDimensions(1000, 2000, 4)).toEqual({ width: 2, height: 4, depth: 0.08 });
  });

  test('fits landscape artwork to the maximum span', () => {
    expect(fitCardDimensions(2000, 1000, 4)).toEqual({ width: 4, height: 2, depth: 0.08 });
  });

  test('keeps square artwork square', () => {
    expect(fitCardDimensions(1000, 1000, 4)).toEqual({ width: 4, height: 4, depth: 0.08 });
  });

  test('uses a portrait fallback for invalid image dimensions', () => {
    expect(fitCardDimensions(0, 0, 4)).toEqual({ width: 3, height: 4, depth: 0.08 });
  });
});
