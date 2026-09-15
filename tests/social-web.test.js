import { describe, expect, test } from 'vitest';

import {
  SOCIAL_LINKS,
  createWebGeometry,
  shouldAnimateSocialWeb,
  stepWebNodes,
} from '../src/social-web.js';

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
  test('includes the public Discord profile as a distinct destination', () => {
    const discord = SOCIAL_LINKS.find((social) => social.id === 'discord');

    expect(discord).toMatchObject({
      mark: 'Ds',
      label: 'Discord - beewaker',
      href: 'https://discord.com/users/338684455348600832',
    });
    expect(new Set(SOCIAL_LINKS.map((social) => social.href)).size).toBe(SOCIAL_LINKS.length);
  });

  test('marks the old Commissions.gg destination as unavailable without removing its link', () => {
    expect(SOCIAL_LINKS.find((social) => social.id === 'commissions')).toMatchObject({
      href: 'https://www.commissions.gg/beewaker',
      unavailable: true,
    });
  });

  test('strips copied share-tracking parameters from TikTok profile URLs', () => {
    const tiktoks = SOCIAL_LINKS.filter((social) => social.id.startsWith('tiktok'));
    expect(tiktoks).toHaveLength(2);
    for (const social of tiktoks) expect(new URL(social.href).search).toBe('');
  });

  test('shows public TikTok handles instead of internal old and new labels', () => {
    expect(SOCIAL_LINKS.find((social) => social.id === 'tiktok-main')?.label).toBe(
      'TikTok · @bewakwe',
    );
    expect(SOCIAL_LINKS.find((social) => social.id === 'tiktok-new')?.label).toBe(
      'TikTok · @beewaker.re',
    );
  });
});

describe('shouldAnimateSocialWeb', () => {
  test('animates only while the socials screen is visible and motion is allowed', () => {
    expect(shouldAnimateSocialWeb?.({ section: 'socials', reducedMotion: false })).toBe(true);
    expect(shouldAnimateSocialWeb?.({ section: 'home', reducedMotion: false })).toBe(false);
    expect(shouldAnimateSocialWeb?.({ section: 'socials', reducedMotion: true })).toBe(false);
  });
});
