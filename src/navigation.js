const SECTIONS = new Set(['home', 'portfolio', 'socials']);

export function getSectionFromHash(hash = '') {
  const normalized = String(hash).trim().replace(/^#/, '').toLowerCase() || 'home';
  return SECTIONS.has(normalized) ? normalized : 'home';
}

export function navigateTo(section, locationObject = window.location) {
  const destination = SECTIONS.has(section) ? section : 'home';
  locationObject.hash = destination === 'home' ? '' : destination;
}

export function renderSection(section, root = document) {
  const destination = SECTIONS.has(section) ? section : 'home';

  root.querySelectorAll('[data-section]').forEach((element) => {
    const isActive = element.dataset.section === destination;
    element.hidden = !isActive;
    element.classList.toggle('is-active', isActive);
    element.setAttribute('aria-hidden', String(!isActive));
  });

  root.querySelectorAll('[data-nav-target]').forEach((element) => {
    const isCurrent = element.dataset.navTarget === destination;
    element.classList.toggle('is-current', isCurrent);
    if (isCurrent) element.setAttribute('aria-current', 'page');
    else element.removeAttribute('aria-current');
  });

  root.documentElement?.setAttribute('data-current-section', destination);
  return destination;
}
