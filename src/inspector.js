export function fitCardDimensions(imageWidth, imageHeight, maxSpan = 4) {
  const safeRatio = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 0.75;
  const width = safeRatio >= 1 ? maxSpan : maxSpan * safeRatio;
  const height = safeRatio >= 1 ? maxSpan / safeRatio : maxSpan;

  return {
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
    depth: Number((maxSpan * 0.008).toFixed(4)),
  };
}

export function fitInspectorSpan(cardWidth, cardHeight, viewportWidth, viewportHeight, margin = 1.15) {
  const safeAspect = viewportWidth > 0 && viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
  const heightForCardHeight = cardHeight * margin;
  const heightForCardWidth = (cardWidth * margin) / safeAspect;

  return Number(Math.max(heightForCardHeight, heightForCardWidth).toFixed(4));
}

export function getFaceEmissiveIntensity(faceAlignment, maximum = 0.35) {
  const alignment = Number.isFinite(faceAlignment) ? Math.min(1, Math.abs(faceAlignment)) : 1;
  return Number((maximum * alignment ** 8).toFixed(4));
}

export function isBackFaceVisible(faceAlignment, threshold = 0.82) {
  return Number.isFinite(faceAlignment) && faceAlignment <= -Math.abs(threshold);
}

export function resetInspectorViewport(viewport) {
  if (!viewport) return;

  for (const child of [...viewport.children]) {
    if (!child.hasAttribute?.('data-inspector-status')) child.remove();
  }
}

export function shouldFlipInspectorOnKeydown(event) {
  if (event?.key !== 'Enter' || event.repeat) return false;

  const target = event.target;
  if (
    typeof target?.closest === 'function' &&
    target.closest('button, a[href], textarea, input, select, [contenteditable="true"]')
  ) {
    return false;
  }

  return true;
}

export function getInspectorInitialFocusTarget({ flipButton, closeButton } = {}) {
  return flipButton || closeButton || null;
}

export function disposeInspectorGpuResources({
  renderer,
  textures = [],
  geometry,
  materials = [],
} = {}) {
  textures.forEach((texture) => texture?.dispose?.());
  geometry?.dispose?.();
  [...new Set(materials.filter(Boolean))].forEach((material) => material.dispose?.());
  renderer?.dispose?.();
  renderer?.forceContextLoss?.();
  renderer?.domElement?.remove?.();
}

export function isCurrentInspectorSession(sessionToken, currentToken) {
  return sessionToken === currentToken;
}

export function restoreInspectorFocus(trigger, root = globalThis.document) {
  const hidden = !trigger?.isConnected || Boolean(trigger.closest?.('[hidden], [aria-hidden="true"]'));
  if (!trigger || hidden) {
    root?.querySelector?.('[data-nav-target="home"]')?.focus?.({ preventScroll: true });
    return;
  }

  trigger.focus({ preventScroll: true });
}

export function createArtworkCreditLink(item, documentRoot = document) {
  if (!item.credit?.label || !item.credit?.url) return null;

  try {
    const parsedUrl = new URL(item.credit.url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;
  } catch {
    return null;
  }

  const link = documentRoot.createElement('a');
  link.className = 'inspector__credit';
  link.href = item.credit.url;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  link.textContent = `${item.credit.label} \u2197`;
  link.hidden = true;
  return link;
}

export function flipArtworkCard(card, worldYAxis) {
  card.rotateOnWorldAxis(worldYAxis, Math.PI);
}

export function filterRotationDelta(deltaX, deltaY) {
  let x = deltaX;
  let y = deltaY;
  const absoluteX = Math.abs(x);
  const absoluteY = Math.abs(y);

  if (absoluteX > absoluteY && absoluteY / absoluteX < 0.35) {
    y = absoluteY <= 1.25 ? 0 : y * 0.15;
  } else if (absoluteY > absoluteX && absoluteX / absoluteY < 0.35) {
    x = absoluteX <= 1.25 ? 0 : x * 0.15;
  }

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
  };
}

export function createCardMaterials(THREE, frontTexture, backTexture) {
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x363530,
    metalness: 0.04,
    roughness: 0.82,
  });
  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    emissive: 0xffffff,
    emissiveMap: frontTexture,
    emissiveIntensity: 0.35,
    metalness: 0,
    roughness: 0.94,
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    emissive: 0xffffff,
    emissiveMap: backTexture,
    emissiveIntensity: 0.35,
    metalness: 0,
    roughness: 0.94,
  });

  return [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial];
}

export function createInspectorLights(THREE, cardWidth = 4) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.48);
  const key = new THREE.PointLight(0xfff3df, 32, 0, 2);
  key.position.set(-2.8, 3.4, 6.5);
  const accent = new THREE.PointLight(0xffe6c7, 8, 12, 2);
  accent.position.set(-cardWidth, 0, 4.5);

  return [ambient, key, accent];
}

function resolveAsset(baseUrl, relativePath) {
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${relativePath}`;
}

function makeInformationCanvas(item, ratio) {
  const canvas = document.createElement('canvas');
  if (ratio >= 1) {
    canvas.width = 1280;
    canvas.height = Math.max(640, Math.round(1280 / ratio));
  } else {
    canvas.height = 1280;
    canvas.width = Math.max(640, Math.round(1280 * ratio));
  }

  const context = canvas.getContext('2d');
  const scale = Math.min(canvas.width, canvas.height);
  const margin = scale * 0.085;
  context.fillStyle = '#b7b5aa';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = '#383a35';
  context.lineWidth = Math.max(2, scale * 0.004);
  context.strokeRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);

  context.fillStyle = '#282a27';
  context.font = `600 ${Math.round(scale * 0.035)}px monospace`;
  context.textBaseline = 'top';
  context.fillText('BEEWAKER / VISUAL RECORD', margin * 1.35, margin * 1.35);

  const titleSize = Math.round(scale * 0.085);
  context.font = `500 ${titleSize}px Georgia, serif`;
  const title = item.title || 'Untitled';
  const titleWidth = canvas.width - margin * 2.7;
  const titleWords = title.split(/\s+/);
  const titleLines = [];
  let currentLine = '';
  titleWords.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width > titleWidth && currentLine) {
      titleLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });
  if (currentLine) titleLines.push(currentLine);

  const titleTop = margin * 2.5;
  titleLines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, margin * 1.35, titleTop + index * titleSize * 0.95);
  });

  const details = [
    item.year ? `YEAR / ${item.year}` : null,
    item.characters?.length ? `CHARACTERS / ${item.characters.join(', ')}` : null,
  ].filter(Boolean);
  context.font = `500 ${Math.round(scale * 0.026)}px monospace`;
  details.forEach((line, index) => {
    context.fillText(line, margin * 1.35, titleTop + titleSize * 3.25 + index * scale * 0.055);
  });

  if (item.description) {
    context.font = `400 ${Math.round(scale * 0.028)}px monospace`;
    const words = item.description.split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > titleWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);

    const descriptionTop = Math.max(canvas.height * 0.58, titleTop + titleSize * 4.5);
    lines.slice(0, 7).forEach((text, index) => {
      context.fillText(text, margin * 1.35, descriptionTop + index * scale * 0.043);
    });
  }

  context.fillStyle = '#7e2025';
  context.fillRect(margin * 1.35, canvas.height - margin * 1.55, scale * 0.16, Math.max(3, scale * 0.007));
  context.fillStyle = '#4d4f49';
  context.font = `500 ${Math.round(scale * 0.022)}px monospace`;
  context.textAlign = 'right';
  context.fillText(item.id?.toUpperCase() || 'UNTITLED', canvas.width - margin * 1.35, canvas.height - margin * 1.78);

  return canvas;
}

export function createInspector(dialog, baseUrl = '/') {
  const viewport = dialog.querySelector('[data-inspector-viewport]');
  const status = dialog.querySelector('[data-inspector-status]');
  const title = dialog.querySelector('[data-inspector-title]');
  const closeButton = dialog.querySelector('[data-inspector-close]');
  const flipButton = dialog.querySelector('[data-inspector-flip]');
  let activeTrigger = null;
  let openToken = 0;
  let cleanupScene = () => {};
  let flipHandler = null;
  let previousOverflow = '';

  function setStatus(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = !message;
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function onBackdropPointerDown(event) {
    if (event.target === dialog) close();
  }

  function onCancel(event) {
    event.preventDefault();
    close();
  }

  function onDialogKeydown(event) {
    if (!flipHandler || !shouldFlipInspectorOnKeydown(event)) return;
    event.preventDefault();
    flipHandler(event);
  }

  function onDialogClose() {
    openToken += 1;
    flipHandler = null;
    cleanupScene();
    cleanupScene = () => {};
    document.documentElement.style.overflow = previousOverflow;
    restoreInspectorFocus(activeTrigger);
    activeTrigger = null;
  }

  async function open(item, trigger) {
    openToken += 1;
    const token = openToken;
    flipHandler = null;
    cleanupScene();
    cleanupScene = () => {};
    resetInspectorViewport(viewport);
    activeTrigger = trigger;
    title.textContent = item.title;
    setStatus('Loading visual record…', 'loading');
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    getInspectorInitialFocusTarget({ flipButton, closeButton })?.focus({ preventScroll: true });

    let renderer;
    const textures = [];
    let geometry;
    let materials = [];
    let frameId = 0;
    let unbind = () => {};
    let creditLink = null;

    const runCleanup = () => {
      cancelAnimationFrame(frameId);
      if (isCurrentInspectorSession(token, openToken)) flipHandler = null;
      unbind();
      unbind = () => {};
      disposeInspectorGpuResources({ renderer, textures, geometry, materials });
      creditLink?.remove();
      renderer = undefined;
      textures.length = 0;
      geometry = undefined;
      materials = [];
    };

    cleanupScene = runCleanup;

    try {
      const THREE = await import('three');
      if (token !== openToken || !dialog.open) return;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'inspector__canvas';
      renderer.domElement.setAttribute('aria-label', `${item.title}, rotatable artwork card`);
      renderer.domElement.setAttribute('role', 'img');
      viewport.append(renderer.domElement);
      creditLink = createArtworkCreditLink(item);
      if (creditLink) viewport.append(creditLink);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
      camera.position.z = 10;

      const textureLoader = new THREE.TextureLoader();
      const frontTexture = await textureLoader.loadAsync(resolveAsset(baseUrl, item.src));
      textures.push(frontTexture);
      if (token !== openToken || !dialog.open) {
        runCleanup();
        return;
      }
      frontTexture.colorSpace = THREE.SRGBColorSpace;
      frontTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const imageWidth = frontTexture.image?.naturalWidth || frontTexture.image?.width || 0;
      const imageHeight = frontTexture.image?.naturalHeight || frontTexture.image?.height || 0;
      const ratio = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 0.75;
      const dimensions = fitCardDimensions(imageWidth, imageHeight, 4);
      scene.add(...createInspectorLights(THREE, dimensions.width));

      let backTexture;
      if (item.backImage) {
        backTexture = await textureLoader.loadAsync(resolveAsset(baseUrl, item.backImage));
      } else {
        backTexture = new THREE.CanvasTexture(makeInformationCanvas(item, ratio));
      }
      textures.push(backTexture);

      if (token !== openToken || !dialog.open) {
        runCleanup();
        return;
      }
      backTexture.colorSpace = THREE.SRGBColorSpace;
      backTexture.anisotropy = frontTexture.anisotropy;

      geometry = new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth, 1, 1, 1);
      materials = createCardMaterials(THREE, frontTexture, backTexture);
      const card = new THREE.Mesh(geometry, materials);
      card.rotation.set(0.04, -0.08, 0);
      scene.add(card);

      const axisX = new THREE.Vector3(1, 0, 0);
      const axisY = new THREE.Vector3(0, 1, 0);
      const axisZ = new THREE.Vector3(0, 0, 1);
      const localFaceNormal = new THREE.Vector3(0, 0, 1);
      const worldFaceNormal = new THREE.Vector3();
      const viewDirection = new THREE.Vector3();
      let dragging = false;
      let pointerId = null;
      let previousX = 0;
      let previousY = 0;
      let velocityX = 0;
      let velocityY = 0;
      let velocityZ = 0;

      function updateCreditVisibility(faceAlignment, focusCredit = false) {
        if (!creditLink) return;
        const visible = isBackFaceVisible(faceAlignment);
        creditLink.hidden = !visible;
        if (visible && focusCredit) {
          requestAnimationFrame(() => creditLink.focus({ preventScroll: true }));
        }
      }

      function onFlip(event) {
        velocityX = 0;
        velocityY = 0;
        velocityZ = 0;
        flipArtworkCard(card, axisY);
        worldFaceNormal.copy(localFaceNormal).applyQuaternion(card.quaternion).normalize();
        viewDirection.copy(camera.position).sub(card.position).normalize();
        updateCreditVisibility(worldFaceNormal.dot(viewDirection), event.detail === 0);
      }

      flipHandler = onFlip;

      function resize() {
        const bounds = viewport.getBoundingClientRect();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        const aspect = width / height;
        const span = fitInspectorSpan(dimensions.width, dimensions.height, width, height);
        camera.left = (-span * aspect) / 2;
        camera.right = (span * aspect) / 2;
        camera.top = span / 2;
        camera.bottom = -span / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }

      function onPointerDown(event) {
        dragging = true;
        pointerId = event.pointerId;
        previousX = event.clientX;
        previousY = event.clientY;
        velocityX = 0;
        velocityY = 0;
        velocityZ = 0;
        renderer.domElement.setPointerCapture(pointerId);
        renderer.domElement.classList.add('is-dragging');
      }

      function onPointerMove(event) {
        if (!dragging || event.pointerId !== pointerId) return;
        const rawDeltaX = event.clientX - previousX;
        const rawDeltaY = event.clientY - previousY;
        previousX = event.clientX;
        previousY = event.clientY;
        const { x: deltaX, y: deltaY } = filterRotationDelta(rawDeltaX, rawDeltaY);

        if (event.shiftKey) {
          velocityZ = deltaX * 0.006;
          card.rotateOnWorldAxis(axisZ, velocityZ);
        } else {
          velocityY = deltaX * 0.006;
          velocityX = deltaY * 0.006;
          card.rotateOnWorldAxis(axisY, velocityY);
          card.rotateOnWorldAxis(axisX, velocityX);
        }
      }

      function endPointer(event) {
        if (event.pointerId !== pointerId) return;
        dragging = false;
        pointerId = null;
        renderer.domElement.classList.remove('is-dragging');
      }

      function resetCard() {
        card.quaternion.identity();
        card.rotation.set(0.04, -0.08, 0);
        velocityX = 0;
        velocityY = 0;
        velocityZ = 0;
      }

      function onWheel(event) {
        event.preventDefault();
        velocityZ = -event.deltaY * 0.0007;
        card.rotateOnWorldAxis(axisZ, velocityZ);
      }

      function animate() {
        if (!dragging && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          velocityX *= 0.94;
          velocityY *= 0.94;
          velocityZ *= 0.94;
          if (Math.abs(velocityY) > 0.0001) card.rotateOnWorldAxis(axisY, velocityY);
          if (Math.abs(velocityX) > 0.0001) card.rotateOnWorldAxis(axisX, velocityX);
          if (Math.abs(velocityZ) > 0.0001) card.rotateOnWorldAxis(axisZ, velocityZ);
        }
        worldFaceNormal.copy(localFaceNormal).applyQuaternion(card.quaternion).normalize();
        viewDirection.copy(camera.position).sub(card.position).normalize();
        const faceAlignment = worldFaceNormal.dot(viewDirection);
        const emissiveIntensity = getFaceEmissiveIntensity(faceAlignment);
        materials[4].emissiveIntensity = emissiveIntensity;
        materials[5].emissiveIntensity = emissiveIntensity;
        updateCreditVisibility(faceAlignment);
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', endPointer);
      renderer.domElement.addEventListener('pointercancel', endPointer);
      renderer.domElement.addEventListener('dblclick', resetCard);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
      const onContextMenu = (event) => event.preventDefault();
      renderer.domElement.addEventListener('contextmenu', onContextMenu);
      flipButton.addEventListener('click', onFlip);
      window.addEventListener('resize', resize);
      const viewportObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
      viewportObserver?.observe(viewport);
      unbind = () => {
        window.removeEventListener('resize', resize);
        viewportObserver?.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', endPointer);
        renderer.domElement.removeEventListener('pointercancel', endPointer);
        renderer.domElement.removeEventListener('dblclick', resetCard);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('contextmenu', onContextMenu);
        flipButton.removeEventListener('click', onFlip);
      };

      resize();
      animate();
      setStatus('', 'ready');
    } catch (error) {
      console.error(error);
      runCleanup();
      if (!isCurrentInspectorSession(token, openToken)) return;
      cleanupScene = () => {};
      if (dialog.open) {
        setStatus('This visual record could not be rendered.', 'error');
      }
    }
  }

  closeButton.addEventListener('click', close);
  dialog.addEventListener('pointerdown', onBackdropPointerDown);
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('keydown', onDialogKeydown);
  dialog.addEventListener('close', onDialogClose);

  return {
    open,
    close,
    destroy() {
      close();
      flipHandler = null;
      cleanupScene();
      closeButton.removeEventListener('click', close);
      dialog.removeEventListener('pointerdown', onBackdropPointerDown);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('keydown', onDialogKeydown);
      dialog.removeEventListener('close', onDialogClose);
    },
  };
}
