import { describe, expect, test } from 'vitest';

import { applyLocationChange, getSectionFromHash } from '../src/navigation.js';

describe('getSectionFromHash', () => {
  test.each([
    ['', 'home'],
    ['#', 'home'],
    ['#home', 'home'],
    ['#portfolio', 'portfolio'],
    ['#commissions', 'commissions'],
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

describe('applyLocationChange', () => {
  function fakeRoot(active = 'home') {
    const classLists = new Map();
    const sections = ['home', 'portfolio', 'commissions', 'socials'].map((section) => ({
      dataset: { section },
      hidden: section !== active,
      classList: {
        toggle(name, value) {
          classLists.set(`${section}:${name}`, value);
        },
      },
      setAttribute() {},
    }));

    return {
      querySelectorAll(selector) {
        if (selector === '[data-section]') return sections;
        if (selector === '[data-nav-target]') return [];
        return [];
      },
      documentElement: { setAttribute() {} },
    };
  }

  test('closes the inspector after the new section is visible', () => {
    const order = [];
    const root = fakeRoot('portfolio');
    const commissions = root.querySelectorAll('[data-section]')[2];

    applyLocationChange({
      hash: '#commissions',
      inspector: {
        close: () => {
          order.push('close');
          order.push(commissions.hidden);
        },
      },
      root,
    });

    expect(order).toEqual(['close', false]);
    expect(commissions.hidden).toBe(false);
  });

  test('still changes section when no inspector is mounted', () => {
    const root = fakeRoot('home');

    expect(applyLocationChange({ hash: '#portfolio', root })).toBe('portfolio');
    expect(root.querySelectorAll('[data-section]')[1].hidden).toBe(false);
  });
});
