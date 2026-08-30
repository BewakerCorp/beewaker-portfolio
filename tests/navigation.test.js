import { describe, expect, test } from 'vitest';

import { getSectionFromHash } from '../src/navigation.js';

describe('getSectionFromHash', () => {
  test.each([
    ['', 'home'],
    ['#', 'home'],
    ['#home', 'home'],
    ['#portfolio', 'portfolio'],
    ['#socials', 'socials'],
  ])('maps %s to %s', (hash, section) => {
    expect(getSectionFromHash(hash)).toBe(section);
  });

  test('normalizes casing and surrounding whitespace', () => {
    expect(getSectionFromHash('  #PORTFOLIO  ')).toBe('portfolio');
  });

  test('falls back to the landing section for unknown hashes', () => {
    expect(getSectionFromHash('#missing')).toBe('home');
  });
});
