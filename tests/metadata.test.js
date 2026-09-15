import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('site metadata', () => {
  test('declares canonical, Open Graph, and Twitter sharing metadata', () => {
    expect(page).toContain(
      '<link rel="canonical" href="https://bewakercorp.github.io/beewaker-portfolio/" />',
    );
    expect(page).toContain('<meta property="og:type" content="website" />');
    expect(page).toContain('<meta property="og:title" content="Beewaker — Art Archive" />');
    expect(page).toMatch(
      /<meta\s+property="og:image"\s+content="https:\/\/bewakercorp\.github\.io\/beewaker-portfolio\/social-card\.png"\s*\/?>/,
    );
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  test('declares local browser and touch icons', () => {
    expect(page).toContain('<link rel="icon" href="%BASE_URL%favicon.svg" type="image/svg+xml" />');
    expect(page).toContain('<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png" />');
  });

  test('ships the declared assets and crawler policy', () => {
    for (const path of ['favicon.svg', 'apple-touch-icon.png', 'social-card.png', 'robots.txt']) {
      expect(existsSync(new URL(`../public/${path}`, import.meta.url)), path).toBe(true);
    }

    const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /beewaker-portfolio/');
  });
});
