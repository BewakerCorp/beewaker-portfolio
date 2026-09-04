import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import * as inspector from '../src/inspector.js';

const {
  createCardMaterials,
  createInspectorLights,
  fitCardDimensions,
  fitInspectorSpan,
} = inspector;

describe('fitCardDimensions', () => {
  test('fits portrait artwork to the maximum span', () => {
    expect(fitCardDimensions(1000, 2000, 4)).toEqual({ width: 2, height: 4, depth: 0.032 });
  });

  test('fits landscape artwork to the maximum span', () => {
    expect(fitCardDimensions(2000, 1000, 4)).toEqual({ width: 4, height: 2, depth: 0.032 });
  });

  test('keeps square artwork square', () => {
    expect(fitCardDimensions(1000, 1000, 4)).toEqual({ width: 4, height: 4, depth: 0.032 });
  });

  test('uses a portrait fallback for invalid image dimensions', () => {
    expect(fitCardDimensions(0, 0, 4)).toEqual({ width: 3, height: 4, depth: 0.032 });
  });
});

describe('card lighting', () => {
  test('keeps a face-on artwork bright and quickly restores shading as it tilts', () => {
    expect(inspector.getFaceEmissiveIntensity?.(1)).toBe(0.35);
    expect(inspector.getFaceEmissiveIntensity?.(0.7)).toBeLessThan(0.05);
    expect(inspector.getFaceEmissiveIntensity?.(0)).toBe(0);
    expect(inspector.getFaceEmissiveIntensity?.(-1)).toBe(0.35);
  });

  test('uses light-reactive materials for the artwork faces and edges', () => {
    const frontTexture = new THREE.Texture();
    const backTexture = new THREE.Texture();

    const materials = createCardMaterials(THREE, frontTexture, backTexture);

    expect(materials).toHaveLength(6);
    expect(materials.every((material) => material.isMeshStandardMaterial)).toBe(true);
    expect(materials[4].map).toBe(frontTexture);
    expect(materials[5].map).toBe(backTexture);
    expect(materials[4].emissiveMap).toBe(frontTexture);
    expect(materials[5].emissiveMap).toBe(backTexture);
    expect(materials[4].emissive.getHex()).toBe(0xffffff);
    expect(materials[5].emissive.getHex()).toBe(0xffffff);
    expect(materials[4].emissiveIntensity).toBeGreaterThan(0);
    expect(materials[5].emissiveIntensity).toBeGreaterThan(0);

    [...new Set(materials)].forEach((material) => material.dispose());
    frontTexture.dispose();
    backTexture.dispose();
  });

  test('places a soft key light and a weaker left accent in front of the card', () => {
    const lights = createInspectorLights(THREE, 3);
    const ambient = lights.find((light) => light.isAmbientLight);
    const pointLights = lights.filter((light) => light.isPointLight);
    const accent = pointLights.find((light) => light.position.y === 0);
    const key = pointLights.find((light) => light !== accent);

    expect(ambient).toBeDefined();
    expect(pointLights).toHaveLength(2);
    expect(key).toBeDefined();
    expect(key.position.z).toBeGreaterThan(0);
    expect(key.decay).toBeGreaterThan(0);
    expect(accent?.position.toArray()).toEqual([-3, 0, 4.5]);
    expect(accent?.intensity).toBeLessThan(key.intensity);
  });
});

describe('rotation input', () => {
  test('removes tiny cross-axis jitter from a deliberate horizontal drag', () => {
    expect(inspector.filterRotationDelta?.(10, 1)).toEqual({ x: 10, y: 0 });
  });

  test('softens noticeable cross-axis drift in either dominant direction', () => {
    expect(inspector.filterRotationDelta?.(10, 2)).toEqual({ x: 10, y: 0.3 });
    expect(inspector.filterRotationDelta?.(2, 10)).toEqual({ x: 0.3, y: 10 });
  });

  test('keeps intentional diagonal and slow movement intact', () => {
    expect(inspector.filterRotationDelta?.(10, 5)).toEqual({ x: 10, y: 5 });
    expect(inspector.filterRotationDelta?.(1, 1)).toEqual({ x: 1, y: 1 });
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
