import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractDivByClass(className) {
  const marker = `<div class="${className}">`;
  const start = page.indexOf(marker);
  if (start === -1) return '';

  const tagPattern = /<div\b[^>]*>|<\/div>/g;
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tagPattern.exec(page))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return page.slice(start, tagPattern.lastIndex);
  }

  return '';
}
const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');

describe('commission heading', () => {
  test('keeps the heading free from redundant payment captions', () => {
    expect(page).not.toContain('Custom character artwork / prices in USD');
    expect(page).not.toContain('Contact me before sending any payment.');
  });
});

describe('commission ordering terms', () => {
  test('explains the main ordering path via YCH and Discord', () => {
    expect(page).toMatch(/YCH Commishes/i);
    expect(page).toMatch(/Discord/i);
    expect(page).toMatch(/beewaker/i);
    expect(page).toMatch(/references/i);
  });

  test('documents payment through LavaTop and no pre-acceptance payment', () => {
    expect(page).toContain('LavaTop');
    expect(page).toContain('Please don\u2019t pay before I accept the order.');
    expect(page).toContain('Do not pay before I accept the order.');
  });

  test('documents turnaround from two weeks', () => {
    expect(page).toMatch(/From two weeks/i);
    expect(page).toMatch(/can be earlier/i);
  });

  test('documents soft credit and portfolio usage rights', () => {
    expect(page).toMatch(/If you mention me next to the commission, I\u2019d really appreciate it/);
    expect(page).toContain('I reserve the right to use the finished artwork in my portfolio');
    expect(page).toContain('Commercial use');
  });
});

describe('commission offer layout', () => {
  test('groups the price sheet and checkout separately from the long terms copy', () => {
    const offer = extractDivByClass('commission-offer');

    expect(offer).toContain('class="commission-prices"');
    expect(offer).toContain('class="commission-checkout"');
    expect(offer).not.toContain('class="commissions-copy"');
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
    expect(license).toMatch(/control that recipient\u2019s use of the specific\s+artwork/);
  });
});
