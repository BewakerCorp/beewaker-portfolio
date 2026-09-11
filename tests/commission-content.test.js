import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('commission heading', () => {
  test('keeps the heading free from redundant payment captions', () => {
    expect(page).not.toContain('Custom character artwork / prices in USD');
    expect(page).not.toContain('Contact me before sending any payment.');
  });
});
