import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('mobile inspector and commissions layout', () => {
  test('keeps the artwork title visible on small screens', () => {
    expect(css).not.toMatch(/\.inspector__header h2\s*\{\s*display:\s*none;/);
  });

  test('lets the commissions heading wrap instead of overflowing', () => {
    expect(css).toMatch(/\.commissions-heading h1[\s\S]*?overflow-wrap:\s*anywhere/);
  });
});
