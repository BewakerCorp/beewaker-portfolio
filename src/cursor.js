const INTERACTIVE_SELECTOR = 'a, button, [role="button"], .inspector__canvas';

export function createCustomCursor(root = document, view = window) {
  const hasFinePointer = view.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasFinePointer || prefersReducedMotion || !root.body) {
    return { mount() {}, destroy() {} };
  }

  const cursor = root.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  root.documentElement.classList.add('has-custom-cursor');

  function mount(container = root.body) {
    (container || root.body).append(cursor);
  }

  mount();

  function onPointerMove(event) {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    cursor.classList.add('is-visible');
  }

  function onPointerOver(event) {
    cursor.classList.toggle('is-interactive', Boolean(event.target?.closest?.(INTERACTIVE_SELECTOR)));
  }

  function onPointerDown() {
    cursor.classList.add('is-pressed');
  }

  function onPointerUp() {
    cursor.classList.remove('is-pressed');
  }

  function hideCursor() {
    cursor.classList.remove('is-visible', 'is-interactive', 'is-pressed');
  }

  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerover', onPointerOver);
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('pointerleave', hideCursor);
  view.addEventListener('blur', hideCursor);

  return {
    mount,
    destroy() {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerover', onPointerOver);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
      root.removeEventListener('pointerleave', hideCursor);
      view.removeEventListener('blur', hideCursor);
      root.documentElement.classList.remove('has-custom-cursor');
      cursor.remove();
    },
  };
}
