import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');

describe('commission heading', () => {
  test('keeps the heading free from redundant payment captions', () => {
    expect(page).not.toContain('Custom character artwork / prices in USD');
    expect(page).not.toContain('Contact me before sending any payment.');
  });
});

describe('gallery live region', () => {
  test('announces loading without making all artwork buttons a live region', () => {
    expect(page).not.toMatch(/id="gallery"[^>]*aria-live/);
    expect(page).toMatch(/<p aria-live="polite">The archive is being indexed\.<\/p>/);
  });
});

describe('artwork rights notices', () => {
  test('credits underlying third-party characters and settings on the rendered site', () => {
    expect(page).toContain('Third-party characters and settings belong to their respective owners.');
  });

  test('keeps separately agreed client permissions outside the repository-wide restrictions', () => {
    expect(license).toContain('SEPARATE CLIENT PERMISSIONS');
    expect(license).toMatch(
      /separate written permissions agreed between Beewaker and that\s+recipient/,
    );
    expect(license).toMatch(/control that recipient’s use of the specific\s+artwork/);
  });
});
