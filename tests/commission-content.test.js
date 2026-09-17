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
  test('explains what to send and when an order is accepted', () => {
    expect(page).toMatch(/character references/i);
    expect(page).toMatch(/pose and expression/i);
    expect(page).toMatch(/preferred\s+deadline/i);
    expect(page).toContain('The order is confirmed only after I explicitly accept it');
  });

  test('documents the staged Boosty payment flow', () => {
    expect(page).toContain('Orders up to $25 require full payment before work begins.');
    expect(page).toContain('Orders above $25 require a 50% payment before work begins.');
    expect(page).toContain('The remaining 50% is paid after the protected final preview is approved.');
    expect(page).toContain('Clean full-resolution files are delivered only after full payment.');
    expect(page).not.toContain('Payment through Boosty is requested only after the sketch is ready.');
  });

  test('documents revisions, cancellation, delivery and delay handling', () => {
    expect(page).toContain('up to two rounds of revisions');
    expect(page).toContain('payments are non-refundable');
    expect(page).toContain('PNG and/or JPG');
    expect(page).toContain('Source and project files are not included.');
    expect(page).toContain('the remaining payment may be reduced depending on the length of the delay');
  });

  test('documents additional pricing and usage boundaries', () => {
    expect(page).toContain('Additional character: +80% of the base price.');
    expect(page).toContain('Highly complex character design: up to +50%.');
    expect(page).toContain('Rush orders may be available');
    expect(page).toContain('Commercial use, resale, and redistribution for profit are not permitted');
    expect(page).toContain('Privacy can be discussed before the order is accepted.');
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
    expect(license).toMatch(/control that recipient’s use of the specific\s+artwork/);
  });
});
