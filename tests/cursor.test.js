import { describe, expect, test } from 'vitest';

import { createCustomCursor } from '../src/cursor.js';

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  toggle(name, force) {
    if (force) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, event = {}) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

function makeEnvironment({ finePointer = true, reducedMotion = false } = {}) {
  const root = new FakeEventTarget();
  const cursor = {
    className: '',
    classList: new FakeClassList(),
    style: {},
    removed: false,
    setAttribute() {},
    remove() {
      this.removed = true;
    },
  };

  root.documentElement = { classList: new FakeClassList() };
  root.body = {
    children: [],
    append(element) {
      this.children.push(element);
      element.parentContainer = this;
    },
  };
  root.createElement = () => cursor;

  const view = new FakeEventTarget();
  view.matchMedia = (query) => ({
    matches: query.includes('pointer: fine') ? finePointer : reducedMotion,
  });

  return { root, view, cursor };
}

describe('custom cursor', () => {
  test('tracks the pointer and reacts to interactive controls', () => {
    const { root, view, cursor } = makeEnvironment();
    const controller = createCustomCursor(root, view);

    root.emit('pointermove', { clientX: 120, clientY: 80 });
    root.emit('pointerover', { target: { closest: () => ({}) } });
    root.emit('pointerdown');

    expect(root.body.children).toEqual([cursor]);
    expect(root.documentElement.classList.contains('has-custom-cursor')).toBe(true);
    expect(cursor.classList.contains('is-visible')).toBe(true);
    expect(cursor.classList.contains('is-interactive')).toBe(true);
    expect(cursor.classList.contains('is-pressed')).toBe(true);
    expect(cursor.style.transform).toBe('translate3d(120px, 80px, 0)');

    root.emit('pointerup');
    expect(cursor.classList.contains('is-pressed')).toBe(false);

    controller.destroy();
  });

  test('cleans up its page marker and visual element', () => {
    const { root, view, cursor } = makeEnvironment();
    const controller = createCustomCursor(root, view);

    controller.destroy();

    expect(root.documentElement.classList.contains('has-custom-cursor')).toBe(false);
    expect(cursor.removed).toBe(true);
  });

  test('moves into the inspector layer and returns to the page', () => {
    const { root, view, cursor } = makeEnvironment();
    const inspectorLayer = {
      children: [],
      append(element) {
        this.children.push(element);
        element.parentContainer = this;
      },
    };
    const controller = createCustomCursor(root, view);

    expect(controller.mount).toBeTypeOf('function');
    controller.mount?.(inspectorLayer);
    expect(cursor.parentContainer).toBe(inspectorLayer);

    controller.mount?.();
    expect(cursor.parentContainer).toBe(root.body);
  });

  test('keeps the native cursor for coarse pointers and reduced motion', () => {
    const coarse = makeEnvironment({ finePointer: false });
    const reduced = makeEnvironment({ reducedMotion: true });

    createCustomCursor(coarse.root, coarse.view);
    createCustomCursor(reduced.root, reduced.view);

    expect(coarse.root.body.children).toHaveLength(0);
    expect(reduced.root.body.children).toHaveLength(0);
  });
});
