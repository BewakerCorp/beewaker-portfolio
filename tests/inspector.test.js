import { describe, expect, test } from 'vitest';

import { fitCardDimensions, fitInspectorSpan } from '../src/inspector.js';

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

describe('fitInspectorSpan', () => {
  test('widens the camera view so a square card fits on a narrow phone', () => {
    expect(fitInspectorSpan(4, 4, 390, 725)).toBe(8.5513);
  });

  test('keeps a portrait card fully visible on a narrow phone', () => {
    expect(fitInspectorSpan(2.8, 4, 390, 725)).toBe(5.9859);
  });

  test('uses the card height when a square card already fits on desktop', () => {
    expect(fitInspectorSpan(4, 4, 1180, 731)).toBe(4.6);
  });

  test('falls back to a square viewport when its dimensions are invalid', () => {
    expect(fitInspectorSpan(4, 2, 0, 0)).toBe(4.6);
  });
});
