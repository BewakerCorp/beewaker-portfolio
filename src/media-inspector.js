export function normalizeFrameIndex(index, frameCount) {
  const count = Math.max(1, Math.floor(frameCount) || 1);
  return ((Math.round(index) % count) + count) % count;
}

export function framePath(media, index) {
  const frameCount = Math.max(1, Number(media?.frameCount) || 1);
  const relativeIndex = normalizeFrameIndex(index, frameCount);
  const frameNumber = (Number(media?.startFrame) || 0) + relativeIndex;
  const padding = Math.max(1, Number(media?.framePadding) || 4);
  return String(media?.framePattern || '').replace('{frame}', String(frameNumber).padStart(padding, '0'));
}

export function frameIndexFromDrag({ startIndex, deltaX, pixelsPerFrame = 8, frameCount }) {
  const safePixelsPerFrame = Math.max(1, Math.abs(pixelsPerFrame) || 8);
  const frameDelta = Math.round(deltaX / safePixelsPerFrame);
  return normalizeFrameIndex(startIndex + frameDelta, frameCount);
}

export function prefetchOrder(currentIndex, frameCount) {
  const count = Math.max(1, Math.floor(frameCount) || 1);
  const start = normalizeFrameIndex(currentIndex, count);
  const order = [start];

  for (let distance = 1; order.length < count; distance += 1) {
    const clockwise = normalizeFrameIndex(start + distance, count);
    if (!order.includes(clockwise)) order.push(clockwise);
    if (order.length >= count) break;

    const counterclockwise = normalizeFrameIndex(start - distance, count);
    if (!order.includes(counterclockwise)) order.push(counterclockwise);
  }

  return order;
}

export function getInspectorMode(item = {}) {
  if (item.mediaType === 'turntable') return 'turntable';
  if (item.mediaType === 'scene') return 'still';
  if (item.mediaType === 'video') return 'video';
  return 'artwork';
}

export function getInspectorModeHint(mode) {
  if (mode === 'turntable') return 'DRAG / SWIPE ROTATE · ARROW KEYS STEP · SLIDER SCRUB';
  if (mode === 'still') return 'FULL RESOLUTION RENDER';
  if (mode === 'video') return 'MUTED LOOP · USE PLAYER CONTROLS';
  return '';
}

export function resolveMediaAsset(baseUrl, relativePath) {
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${relativePath}`;
}

export function applyVideoWindowAspect(viewport, videoWidth, videoHeight) {
  const inspectorWindow = viewport?.closest?.('.inspector__window');
  const aspectRatio = Number(videoWidth) / Number(videoHeight);

  if (!inspectorWindow || !Number.isFinite(aspectRatio) || aspectRatio <= 0) return () => {};

  inspectorWindow.dataset.mediaFit = 'video';
  inspectorWindow.style.setProperty('--inspector-media-aspect', String(aspectRatio));

  return () => {
    delete inspectorWindow.dataset.mediaFit;
    inspectorWindow.style.removeProperty('--inspector-media-aspect');
  };
}

function createDetails(documentRoot, item, label) {
  const details = documentRoot.createElement('aside');
  details.className = 'media-inspector__details';

  const eyebrow = documentRoot.createElement('p');
  eyebrow.className = 'media-inspector__eyebrow';
  eyebrow.textContent = label;

  const title = documentRoot.createElement('h3');
  title.textContent = item.title;
  details.append(eyebrow, title);

  if (item.description) {
    const description = documentRoot.createElement('p');
    description.className = 'media-inspector__description';
    description.textContent = item.description;
    details.append(description);
  }

  const meta = [
    item.year ? `YEAR / ${item.year}` : null,
    item.characters?.length ? `CHARACTERS / ${item.characters.join(', ')}` : null,
  ].filter(Boolean);
  if (meta.length) {
    const metaList = documentRoot.createElement('p');
    metaList.className = 'media-inspector__meta';
    metaList.textContent = meta.join('\n');
    details.append(metaList);
  }

  return details;
}

function createTurntableView({ item, viewport, baseUrl, setStatus }) {
  const documentRoot = viewport.ownerDocument || document;
  const root = documentRoot.createElement('div');
  root.className = 'media-inspector media-inspector--turntable';

  const stage = documentRoot.createElement('div');
  stage.className = 'media-inspector__stage';
  stage.tabIndex = 0;
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', `${item.title}, interactive 360 degree rendered turntable`);

  const image = documentRoot.createElement('img');
  image.className = 'media-inspector__turntable-image';
  image.alt = '';
  image.draggable = false;

  const scrubber = documentRoot.createElement('label');
  scrubber.className = 'media-inspector__scrubber';
  const scrubberLabel = documentRoot.createElement('span');
  scrubberLabel.textContent = 'ROTATION';
  const input = documentRoot.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = String(item.media.frameCount - 1);
  input.step = '1';
  input.value = '0';
  input.setAttribute('aria-label', `Rotate ${item.title}`);
  const counter = documentRoot.createElement('output');
  counter.setAttribute('aria-live', 'polite');
  scrubber.append(scrubberLabel, input, counter);

  const details = createDetails(documentRoot, item, `RENDERED CHARACTER / ${item.media.frameCount} FRAMES`);
  stage.append(image);
  root.append(stage, scrubber, details);
  viewport.append(root);

  let currentIndex = 0;
  let startIndex = 0;
  let startX = 0;
  let pointerId = null;
  let destroyed = false;
  let preloadTimer = null;
  const warmImages = new Set();

  function updateFrame(index) {
    const nextIndex = normalizeFrameIndex(index, item.media.frameCount);
    if (nextIndex === currentIndex && image.src) return;
    currentIndex = nextIndex;
    image.src = resolveMediaAsset(baseUrl, framePath(item.media, currentIndex));
    input.value = String(currentIndex);
    counter.value = `${String(currentIndex + 1).padStart(2, '0')} / ${String(item.media.frameCount).padStart(2, '0')}`;
    counter.textContent = counter.value;
  }

  function warmSequence() {
    const ImageConstructor = documentRoot.defaultView?.Image || globalThis.Image;
    if (typeof ImageConstructor !== 'function') return;
    const queue = prefetchOrder(currentIndex, item.media.frameCount).slice(1);

    const warmNext = () => {
      if (destroyed || queue.length === 0) return;
      const index = queue.shift();
      const warmImage = new ImageConstructor();
      warmImage.decoding = 'async';
      warmImage.src = resolveMediaAsset(baseUrl, framePath(item.media, index));
      warmImages.add(warmImage);
      preloadTimer = setTimeout(warmNext, queue.length > 36 ? 0 : 18);
    };

    warmNext();
  }

  function onInitialLoad() {
    image.removeEventListener('load', onInitialLoad);
    setStatus('', 'ready');
    warmSequence();
  }

  function onImageError() {
    setStatus('This turntable frame could not be loaded.', 'error');
  }

  function onPointerDown(event) {
    pointerId = event.pointerId;
    startX = event.clientX;
    startIndex = currentIndex;
    stage.setPointerCapture?.(pointerId);
    stage.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId) return;
    updateFrame(frameIndexFromDrag({
      startIndex,
      deltaX: event.clientX - startX,
      pixelsPerFrame: 8,
      frameCount: item.media.frameCount,
    }));
  }

  function onPointerEnd(event) {
    if (event.pointerId !== pointerId) return;
    stage.releasePointerCapture?.(pointerId);
    pointerId = null;
    stage.classList.remove('is-dragging');
  }

  function onKeydown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') updateFrame(0);
    else if (event.key === 'End') updateFrame(item.media.frameCount - 1);
    else updateFrame(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }

  function onInput() {
    updateFrame(Number(input.value));
  }

  image.addEventListener('load', onInitialLoad);
  image.addEventListener('error', onImageError);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
  stage.addEventListener('keydown', onKeydown);
  input.addEventListener('input', onInput);
  updateFrame(0);

  if (image.complete && image.naturalWidth) onInitialLoad();

  return {
    initialFocus: stage,
    cleanup() {
      destroyed = true;
      clearTimeout(preloadTimer);
      image.removeEventListener('load', onInitialLoad);
      image.removeEventListener('error', onImageError);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerEnd);
      stage.removeEventListener('pointercancel', onPointerEnd);
      stage.removeEventListener('keydown', onKeydown);
      input.removeEventListener('input', onInput);
      warmImages.clear();
      root.remove();
    },
  };
}

function createStillView({ item, viewport, baseUrl, setStatus }) {
  const documentRoot = viewport.ownerDocument || document;
  const root = documentRoot.createElement('figure');
  root.className = 'media-inspector media-inspector--still';
  const image = documentRoot.createElement('img');
  image.className = 'media-inspector__still-image';
  image.alt = item.title;
  image.draggable = false;
  image.src = resolveMediaAsset(baseUrl, item.src);
  root.append(image);
  viewport.append(root);

  const onLoad = () => setStatus('', 'ready');
  const onError = () => setStatus('This rendered scene could not be loaded.', 'error');
  image.addEventListener('load', onLoad);
  image.addEventListener('error', onError);
  if (image.complete && image.naturalWidth) onLoad();

  return {
    initialFocus: null,
    cleanup() {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      root.remove();
    },
  };
}

function createVideoView({ item, viewport, baseUrl, setStatus }) {
  const documentRoot = viewport.ownerDocument || document;
  const root = documentRoot.createElement('figure');
  root.className = 'media-inspector media-inspector--video';
  const video = documentRoot.createElement('video');
  video.className = 'media-inspector__video';
  video.controls = true;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.poster = resolveMediaAsset(baseUrl, item.src);
  video.setAttribute('aria-label', item.title);
  video.src = resolveMediaAsset(baseUrl, item.media.src);
  root.append(video);
  viewport.append(root);

  let restoreWindowAspect = () => {};

  const onLoadedMetadata = () => {
    restoreWindowAspect();
    restoreWindowAspect = applyVideoWindowAspect(viewport, video.videoWidth, video.videoHeight);
  };

  const onCanPlay = () => {
    setStatus('', 'ready');
    video.play().catch(() => {});
  };
  const onError = () => setStatus('This motion record could not be loaded.', 'error');
  video.addEventListener('loadedmetadata', onLoadedMetadata);
  video.addEventListener('canplay', onCanPlay);
  video.addEventListener('error', onError);
  video.load();

  return {
    initialFocus: video,
    cleanup() {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      restoreWindowAspect();
      video.pause();
      video.removeAttribute('src');
      video.load();
      root.remove();
    },
  };
}

export function createMediaInspectorView(options) {
  const mode = getInspectorMode(options.item);
  if (mode === 'turntable') return createTurntableView(options);
  if (mode === 'still') return createStillView(options);
  if (mode === 'video') return createVideoView(options);
  throw new Error('Artwork records must use the Three.js inspector');
}
