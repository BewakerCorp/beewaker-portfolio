const SVG_NS = 'http://www.w3.org/2000/svg';

export const SOCIAL_LINKS = Object.freeze([
  {
    id: 'artfight',
    mark: 'Af',
    label: 'Art Fight',
    href: 'https://artfight.net/~Beewaker',
    ring: 4,
    spoke: 9,
  },
  {
    id: 'telegram',
    mark: 'Tg',
    label: 'Telegram',
    href: 'https://t.me/BewakerINC',
    ring: 3,
    spoke: 1,
  },
  {
    id: 'tiktok-main',
    mark: 'Tk',
    label: 'TikTok - old main',
    href: 'https://www.tiktok.com/@bewakwe?_r=1&_t=ZT-99IdmYSSXl8',
    ring: 3,
    spoke: 7,
  },
  {
    id: 'tiktok-new',
    mark: 'Tk',
    label: 'TikTok - new account',
    href: 'https://www.tiktok.com/@beewaker.re?_r=1&_t=ZS-99IdhtE5ikb',
    ring: 3,
    spoke: 3,
  },
  {
    id: 'commissions',
    mark: 'Cm',
    label: 'Commissions.gg',
    href: 'https://www.commissions.gg/beewaker',
    ring: 3,
    spoke: 5,
  },
]);

function webNodeIndex(ring, spoke, spokes) {
  return 1 + (ring - 1) * spokes + spoke;
}

export function createWebGeometry(width, height, spokes = 10, rings = 4, padding = 48) {
  const safeWidth = Math.max(width, padding * 2);
  const safeHeight = Math.max(height, padding * 2);
  const centerX = safeWidth / 2;
  const centerY = safeHeight / 2;
  const radiusX = Math.max(0, centerX - padding);
  const radiusY = Math.max(0, centerY - padding);
  const nodes = [
    { id: 'center', ring: 0, spoke: -1, x: centerX, y: centerY, baseX: centerX, baseY: centerY, vx: 0, vy: 0, mobility: 0.2 },
  ];

  for (let ring = 1; ring <= rings; ring += 1) {
    const ringRatio = ring / rings;

    for (let spoke = 0; spoke < spokes; spoke += 1) {
      const angle = -Math.PI / 2 + (spoke / spokes) * Math.PI * 2;
      const irregularity = 0.97 + Math.sin((spoke + 1) * (ring + 2)) * 0.025;
      const baseX = centerX + Math.cos(angle) * radiusX * ringRatio * irregularity;
      const baseY = centerY + Math.sin(angle) * radiusY * ringRatio * irregularity;

      nodes.push({
        id: `${ring}:${spoke}`,
        ring,
        spoke,
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        vx: 0,
        vy: 0,
        mobility: 0.35 + ringRatio * 0.65,
      });
    }
  }

  const connections = [];

  for (let spoke = 0; spoke < spokes; spoke += 1) {
    connections.push([0, webNodeIndex(1, spoke, spokes)]);

    for (let ring = 2; ring <= rings; ring += 1) {
      connections.push([webNodeIndex(ring - 1, spoke, spokes), webNodeIndex(ring, spoke, spokes)]);
    }
  }

  for (let ring = 1; ring <= rings; ring += 1) {
    for (let spoke = 0; spoke < spokes; spoke += 1) {
      connections.push([
        webNodeIndex(ring, spoke, spokes),
        webNodeIndex(ring, (spoke + 1) % spokes, spokes),
      ]);
    }
  }

  return { nodes, connections, width: safeWidth, height: safeHeight };
}

export function stepWebNodes(nodes, pointer, options = {}) {
  const radius = options.radius ?? 190;
  const repel = options.repel ?? 0.72;
  const spring = options.spring ?? 0.035;
  const damping = options.damping ?? 0.86;

  for (const node of nodes) {
    if (pointer?.active) {
      const dx = node.x - pointer.x;
      const dy = node.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 0.001;

      if (distance < radius) {
        const force = (1 - distance / radius) * repel * node.mobility;
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
      }
    }

    node.vx = (node.vx + (node.baseX - node.x) * spring) * damping;
    node.vy = (node.vy + (node.baseY - node.y) * spring) * damping;
    node.x += node.vx;
    node.y += node.vy;
  }

  return nodes;
}

function createSvgElement(name, className) {
  const element = document.createElementNS(SVG_NS, name);
  if (className) element.setAttribute('class', className);
  return element;
}

function createSocialLink(social) {
  const link = document.createElement('a');
  link.className = 'social-node';
  link.href = social.href;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  link.dataset.socialId = social.id;
  link.setAttribute('aria-label', social.label);

  const disc = document.createElement('span');
  disc.className = 'social-node__disc';
  disc.textContent = social.mark;
  disc.setAttribute('aria-hidden', 'true');

  const tooltip = document.createElement('span');
  tooltip.className = 'social-node__tooltip';
  tooltip.textContent = social.label;
  tooltip.setAttribute('role', 'tooltip');

  link.append(disc, tooltip);
  return link;
}

export function createSocialWeb(root) {
  if (!root) return { destroy() {} };

  const svg = createSvgElement('svg', 'social-web__threads');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  const lineGroup = createSvgElement('g', 'social-web__lines');
  const jointGroup = createSvgElement('g', 'social-web__joints');
  svg.append(lineGroup, jointGroup);

  const linksLayer = document.createElement('div');
  linksLayer.className = 'social-web__links';
  const links = SOCIAL_LINKS.map((social) => {
    const element = createSocialLink(social);
    linksLayer.append(element);
    return { social, element };
  });

  root.replaceChildren(svg, linksLayer);

  let geometry = null;
  let lines = [];
  let joints = [];
  let frameId = 0;
  let lastTime = 0;
  const pointer = { x: 0, y: 0, active: false };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rebuild() {
    const bounds = root.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;

    const padding = bounds.width < 600 ? 42 : 64;
    geometry = createWebGeometry(bounds.width, bounds.height, 10, 4, padding);
    svg.setAttribute('viewBox', `0 0 ${geometry.width} ${geometry.height}`);

    lineGroup.replaceChildren();
    lines = geometry.connections.map((connection) => {
      const [fromIndex, toIndex] = connection;
      const from = geometry.nodes[fromIndex];
      const to = geometry.nodes[toIndex];
      const isSpoke = from.ring === 0 || from.spoke === to.spoke;
      const line = createSvgElement('path', isSpoke ? 'social-web__thread social-web__thread--spoke' : 'social-web__thread');
      lineGroup.append(line);
      return { connection, element: line };
    });

    jointGroup.replaceChildren();
    joints = geometry.nodes.map((node) => {
      const joint = createSvgElement('circle', node.ring === 0 ? 'social-web__joint social-web__joint--center' : 'social-web__joint');
      joint.setAttribute('r', node.ring === 0 ? '2.4' : '1.1');
      jointGroup.append(joint);
      return joint;
    });

    render(0);
  }

  function render(time) {
    if (!geometry) return;

    const positions = geometry.nodes.map((node, index) => {
      if (reducedMotion) return { x: node.x, y: node.y };
      const drift = node.mobility * 1.35;
      return {
        x: node.x + Math.sin(time * 0.00045 + index * 1.7) * drift,
        y: node.y + Math.cos(time * 0.00038 + index * 1.3) * drift,
      };
    });

    for (const line of lines) {
      const [fromIndex, toIndex] = line.connection;
      const from = positions[fromIndex];
      const to = positions[toIndex];
      line.element.setAttribute('d', `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`);
    }

    joints.forEach((joint, index) => {
      joint.setAttribute('cx', positions[index].x.toFixed(2));
      joint.setAttribute('cy', positions[index].y.toFixed(2));
    });

    for (const { social, element } of links) {
      const node = positions[webNodeIndex(social.ring, social.spoke, 10)];
      element.style.transform = `translate3d(${node.x.toFixed(2)}px, ${node.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
    }
  }

  function animate(time) {
    const elapsed = Math.min(32, time - lastTime || 16) / 16;
    lastTime = time;

    if (geometry && !reducedMotion) {
      stepWebNodes(geometry.nodes, pointer, {
        radius: Math.max(140, Math.min(230, geometry.width * 0.18)),
        repel: 0.78 * elapsed,
        spring: 0.032 * elapsed,
        damping: 0.87,
      });
      render(time);
    }

    frameId = requestAnimationFrame(animate);
  }

  function updatePointer(event) {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const bounds = root.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }

  function clearPointer() {
    pointer.active = false;
  }

  root.addEventListener('pointermove', updatePointer);
  root.addEventListener('pointerleave', clearPointer);

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(rebuild);
  resizeObserver?.observe(root);
  window.addEventListener('resize', rebuild);
  rebuild();
  if (!reducedMotion) frameId = requestAnimationFrame(animate);

  return {
    destroy() {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', rebuild);
      root.removeEventListener('pointermove', updatePointer);
      root.removeEventListener('pointerleave', clearPointer);
    },
  };
}
