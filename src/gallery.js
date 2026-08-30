export function calculateTilt({ x, y, width, height }, maxDegrees = 4) {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };

  const horizontal = Math.max(-1, Math.min(1, (x / width - 0.5) * 2));
  const vertical = Math.max(-1, Math.min(1, (y / height - 0.5) * 2));

  return {
    rotateX: -vertical * maxDegrees,
    rotateY: horizontal * maxDegrees,
  };
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
  image.src = resolveAsset(baseUrl, item.src);
  image.alt = item.title;
  image.loading = index < 4 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.draggable = false;

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

export function renderGallery(container, items, onSelect = () => {}, baseUrl = '/') {
  container.replaceChildren();

  if (items.length === 0) {
    container.className = 'gallery-state';
    const message = document.createElement('p');
    message.textContent = 'No visual records have been added yet.';
    container.append(message);
    return;
  }

  container.className = 'gallery-grid';
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => fragment.append(createGalleryCard(item, index, baseUrl, onSelect)));
  container.append(fragment);
}
