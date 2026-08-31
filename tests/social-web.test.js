import { describe, expect, test } from 'vitest';

import { SOCIAL_LINKS, createWebGeometry, stepWebNodes } from '../src/social-web.js';

describe('createWebGeometry', () => {
  test('builds radial and circular threads for every web point', () => {
    const geometry = createWebGeometry(1000, 700, 10, 4);

    expect(geometry.nodes).toHaveLength(41);
    expect(geometry.connections).toHaveLength(80);
  });

  test('keeps the web inside its viewport padding', () => {
    const geometry = createWebGeometry(360, 640, 10, 4, 28);

    for (const node of geometry.nodes) {
      expect(node.baseX).toBeGreaterThanOrEqual(28);
      expect(node.baseX).toBeLessThanOrEqual(332);
      expect(node.baseY).toBeGreaterThanOrEqual(28);
      expect(node.baseY).toBeLessThanOrEqual(612);
    }
  });
});

describe('stepWebNodes', () => {
  test('pushes a nearby point away from the cursor', () => {
    const nodes = [{ x: 100, y: 100, baseX: 100, baseY: 100, vx: 0, vy: 0, mobility: 1 }];

    stepWebNodes(nodes, { x: 80, y: 100, active: true }, { radius: 100, repel: 1, spring: 0, damping: 1 });

    expect(nodes[0].x).toBeGreaterThan(100);
  });

  test('springs a displaced point back toward its resting position', () => {
    const nodes = [{ x: 130, y: 100, baseX: 100, baseY: 100, vx: 0, vy: 0, mobility: 1 }];

    stepWebNodes(nodes, null, { repel: 0, spring: 0.1, damping: 1 });

    expect(nodes[0].x).toBeLessThan(130);
  });
});

describe('SOCIAL_LINKS', () => {
  test('contains five distinct destinations with short marks', () => {
    expect(SOCIAL_LINKS).toHaveLength(5);
    expect(new Set(SOCIAL_LINKS.map((social) => social.href)).size).toBe(5);
    expect(SOCIAL_LINKS.map((social) => social.mark)).toEqual(['Af', 'Tg', 'Tk', 'Tk', 'Cm']);
  });
});
