import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';
import postcss from 'postcss';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const stylesheet = postcss.parse(css);

function declarationsFor(selector, parentType = 'root') {
  const rule = stylesheet.nodes
    .flatMap((node) => (node.type === 'atrule' ? node.nodes || [] : [node]))
    .find((node) => node.type === 'rule' && node.selector === selector && node.parent.type === parentType);

  return Object.fromEntries(
    (rule?.nodes || [])
      .filter((node) => node.type === 'decl')
      .map((declaration) => [declaration.prop, declaration.value]),
  );
}

describe('mobile inspector and commissions layout', () => {
  test('keeps the artwork title visible on small screens', () => {
    expect(css).not.toMatch(/\.inspector__header h2\s*\{\s*display:\s*none;/);
  });

  test('lets the commissions heading and price sheet shrink inside the viewport', () => {
    expect(css).toMatch(/\.commissions-heading h1[\s\S]*?overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.commission-prices[\s\S]*?min-width:\s*0/);
  });

  test('hides desktop-only inspector hints on coarse pointers', () => {
    expect(css).toMatch(/@media\s*\(pointer:\s*coarse\)[\s\S]*?\.inspector__controls span/);
  });
});

describe('portfolio medium sections', () => {
  test('styles visible section headings separately from masonry grids', () => {
    expect(css).toMatch(/\.gallery-section__title\s*\{/);
    expect(css).toMatch(/\.gallery-section\s*\+\s*\.gallery-section/);
  });
});

describe('responsive social and commission layouts', () => {
  test('wraps long social labels inside their tooltip at every viewport width', () => {
    expect(declarationsFor('.social-node__tooltip')).toMatchObject({
      'white-space': 'normal',
      'overflow-wrap': 'anywhere',
    });
  });

  test('keeps the desktop price sheet and checkout in an independent right-hand stack', () => {
    expect(declarationsFor('.commissions-layout')['grid-template-areas']).toContain("'copy offer'");
    expect(declarationsFor('.commission-offer')).toMatchObject({
      display: 'grid',
      'align-content': 'start',
    });
  });
});
