import './styles.css';

import { loadGalleryManifest, renderGallery } from './gallery.js';
import { createInspector } from './inspector.js';
import { getSectionFromHash, navigateTo, renderSection } from './navigation.js';

function syncSection() {
  renderSection(getSectionFromHash(window.location.hash));
}

document.addEventListener('click', (event) => {
  const navigationControl = event.target.closest('[data-nav-target]');
  if (!navigationControl) return;

  event.preventDefault();
  navigateTo(navigationControl.dataset.navTarget);
  syncSection();
});

window.addEventListener('hashchange', syncSection);
syncSection();

const galleryElement = document.querySelector('#gallery');
const inspector = createInspector(document.querySelector('#art-inspector'), import.meta.env.BASE_URL);

document.addEventListener('artwork:select', (event) => {
  inspector.open(event.detail.item, event.detail.trigger);
});

window.addEventListener('pagehide', () => inspector.destroy(), { once: true });

loadGalleryManifest(import.meta.env.BASE_URL)
  .then((items) => {
    renderGallery(
      galleryElement,
      items,
      (item, trigger) => {
        document.dispatchEvent(new CustomEvent('artwork:select', { detail: { item, trigger } }));
      },
      import.meta.env.BASE_URL,
    );
  })
  .catch((error) => {
    console.error(error);
    galleryElement.className = 'gallery-state gallery-state--error';
    galleryElement.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'The visual archive could not be loaded.';
    galleryElement.append(message);
  });
