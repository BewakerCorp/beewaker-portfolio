export function calculateTilt({ x, y, width, height }, maxDegrees = 4) {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };

  const horizontal = Math.max(-1, Math.min(1, (x / width - 0.5) * 2));
  const vertical = Math.max(-1, Math.min(1, (y / height - 0.5) * 2));

  return {
    rotateX: -vertical * maxDegrees,
    rotateY: horizontal * maxDegrees,
  };
}

export function getGalleryColumnCount(viewportWidth) {
  if (viewportWidth <= 560) return 1;
  if (viewportWidth <= 800) return 2;
  if (viewportWidth <= 1200) return 3;
  return 4;
}

export function calculateHorizontalMasonry({
  containerWidth,
  columnCount,
  gap,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  itemHeights,
}) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const availableWidth = Math.max(
    0,
    containerWidth - paddingLeft - paddingRight - gap * (safeColumnCount - 1),
  );
  const columnWidth = availableWidth / safeColumnCount;
  const columnHeights = Array(safeColumnCount).fill(paddingTop);
  const positions = itemHeights.map((itemHeight, index) => {
    const column = index % safeColumnCount;
    const position = {
      column,
      left: paddingLeft + column * (columnWidth + gap),
      top: columnHeights[column],
    };

    columnHeights[column] += itemHeight + gap;
    return position;
  });
  const tallestColumn = Math.max(...columnHeights);
  const height = itemHeights.length
    ? tallestColumn - gap + paddingBottom
    : paddingTop + paddingBottom;

  return { columnWidth, height, positions };
}

export async function loadGalleryManifest(baseUrl, fetcher = fetch) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const response = await fetcher(`${normalizedBase}gallery-manifest.json`);

  if (!response.ok) {
    throw new Error(`Unable to load gallery (${response.status})`);
  }

  const manifest = await response.json();
  if (!Array.isArray(manifest)) throw new Error('Gallery manifest is invalid');
  return manifest;
}

function resolveAsset(baseUrl, relativePath) {
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${relativePath}`;
}

function attachCardTilt(card) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const tilt = calculateTilt(
      {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
      3.5,
    );

    card.style.setProperty('--tilt-x', `${tilt.rotateX}deg`);
    card.style.setProperty('--tilt-y', `${tilt.rotateY}deg`);
    card.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    card.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--pointer-x', '50%');
    card.style.setProperty('--pointer-y', '50%');
  });
}

export function galleryImageAttributes() {
  return {
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    draggable: false,
  };
}

const GALLERY_MEDIUMS = Object.freeze([
  Object.freeze({
    medium: '2d',
    title: '2D ART',
    emptyMessage: 'No 2D works have been added yet.',
  }),
  Object.freeze({
    medium: '3d',
    title: '3D RENDERS',
    emptyMessage: 'No 3D renders have been added yet.',
  }),
]);

export function groupGalleryItems(items = []) {
  return GALLERY_MEDIUMS.map((section) => ({
    ...section,
    items: items.filter((item) => (item.medium === '3d' ? '3d' : '2d') === section.medium),
  }));
}

function markGalleryCardReady(card) {
  card.classList.add('is-ready');
}

function createGalleryCard(item, index, baseUrl, onSelect) {
  const card = document.createElement('button');
  card.className = 'art-card';
  card.type = 'button';
  card.dataset.artId = item.id;
  card.style.setProperty('--entry-delay', `${Math.min(index * 45, 360)}ms`);
  card.setAttribute('aria-label', `Inspect ${item.title}`);

  const frame = document.createElement('span');
  frame.className = 'art-card__frame';

  const image = document.createElement('img');
  Object.assign(image, galleryImageAttributes());
  image.src = resolveAsset(baseUrl, item.src);

  const label = document.createElement('span');
  label.className = 'art-card__label';
  label.innerHTML = `<small>${String(index + 1).padStart(2, '0')}</small><strong></strong><i>inspect ↗</i>`;
  label.querySelector('strong').textContent = item.title;

  frame.append(image);
  card.append(frame, label);
  card.addEventListener('click', () => onSelect(item, card));
  card.addEventListener('contextmenu', (event) => event.preventDefault());
  card.addEventListener('dragstart', (event) => event.preventDefault());
  attachCardTilt(card);
  return card;
}

const galleryLayoutCleanups = new WeakMap();

function installHorizontalMasonry(container) {
  galleryLayoutCleanups.get(container)?.();

  const cards = [...container.querySelectorAll('.art-card')];
  const images = cards.map((card) => card.querySelector('img'));
  let animationFrame = null;

  const readPixels = (styles, property) => Number.parseFloat(styles[property]) || 0;

  const layout = () => {
    animationFrame = null;
    const containerWidth = container.getBoundingClientRect().width;
    if (containerWidth <= 0) return;

    const styles = window.getComputedStyle(container);
    const paddingTop = readPixels(styles, 'paddingTop');
    const paddingRight = readPixels(styles, 'paddingRight');
    const paddingBottom = readPixels(styles, 'paddingBottom');
    const paddingLeft = readPixels(styles, 'paddingLeft');
    const gap = readPixels(styles, 'columnGap');
    const columnCount = getGalleryColumnCount(window.innerWidth);
    const initialLayout = calculateHorizontalMasonry({
      containerWidth,
      columnCount,
      gap,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      itemHeights: [],
    });

    cards.forEach((card) => {
      card.style.width = `${initialLayout.columnWidth}px`;
    });

    const masonry = calculateHorizontalMasonry({
      containerWidth,
      columnCount,
      gap,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      itemHeights: cards.map((card) => card.getBoundingClientRect().height),
    });

    cards.forEach((card, index) => {
      const position = masonry.positions[index];
      card.style.left = `${position.left}px`;
      card.style.top = `${position.top}px`;
    });
    container.style.height = `${masonry.height}px`;

    container.classList.remove('gallery-grid--pending');
    container.classList.add('gallery-grid--ready');
  };

  const scheduleLayout = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(layout);
  };

  const revealHandlers = images.map((image, index) => {
    const card = cards[index];
    const onReveal = () => {
      markGalleryCardReady(card);
      scheduleLayout();
    };
    if (image.complete) {
      markGalleryCardReady(card);
      return null;
    }
    image.addEventListener('load', onReveal);
    image.addEventListener('error', onReveal);
    return onReveal;
  });

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleLayout);
  resizeObserver?.observe(container);
  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('hashchange', scheduleLayout);
  document.fonts?.ready.then(scheduleLayout);
  scheduleLayout();

  galleryLayoutCleanups.set(container, () => {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', scheduleLayout);
    window.removeEventListener('hashchange', scheduleLayout);
    images.forEach((image, index) => {
      const onReveal = revealHandlers[index];
      if (!onReveal) return;
      image.removeEventListener('load', onReveal);
      image.removeEventListener('error', onReveal);
    });
  });
}

export function renderGallery(container, items, onSelect = () => {}, baseUrl = '/') {
  container.querySelectorAll?.('.gallery-grid').forEach((grid) => galleryLayoutCleanups.get(grid)?.());
  container.replaceChildren();
  container.style.removeProperty('height');
  container.className = 'gallery-sections';
  const fragment = document.createDocumentFragment();

  groupGalleryItems(items).forEach(({ medium, title, emptyMessage, items: sectionItems }) => {
    const section = document.createElement('section');
    section.className = 'gallery-section';
    section.dataset.medium = medium;

    const heading = document.createElement('h2');
    heading.className = 'gallery-section__title';
    heading.textContent = title;

    const sectionContent = document.createElement('div');
    if (sectionItems.length === 0) {
      sectionContent.className = 'gallery-state gallery-state--empty';
      const message = document.createElement('p');
      message.textContent = emptyMessage;
      sectionContent.append(message);
    } else {
      sectionContent.className = 'gallery-grid gallery-grid--pending';
      sectionItems.forEach((item, index) => {
        sectionContent.append(createGalleryCard(item, index, baseUrl, onSelect));
      });
    }

    section.append(heading, sectionContent);
    fragment.append(section);
  });

  container.append(fragment);
  container.querySelectorAll('.gallery-grid').forEach(installHorizontalMasonry);
}
