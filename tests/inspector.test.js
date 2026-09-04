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

  test('places a soft key light in front of the rotatable card', () => {
    const lights = createInspectorLights(THREE);
    const ambient = lights.find((light) => light.isAmbientLight);
    const key = lights.find((light) => light.isPointLight);

    expect(ambient).toBeDefined();
    expect(key).toBeDefined();
    expect(key.position.z).toBeGreaterThan(0);
    expect(key.decay).toBeGreaterThan(0);
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
