(() => {
  'use strict';

  // This file intentionally contains no write endpoint, storage client, upload, or publish call.
  // It maps the committed Mothership slot IDs into a safe interface prototype.
  const pages = [
    { id: 'home', label: 'Home', url: 'https://yourfavalien.com/', title: 'YourFavAlien | Official Website', sections: [
      { id: 'home-hero-media', label: 'Homepage hero media', type: 'Image or video', path: 'slots/home-hero-media', note: 'Uses the existing hero slot and current responsive behavior.' },
      { id: 'home-identity', label: 'Homepage identity line', type: 'Text', note: 'Current public home copy; no live text editing in this prototype.' },
      { id: 'home-menu', label: 'Homepage menu', type: 'Navigation', note: 'Mapped to the existing global menu theme settings.' }
    ] },
    { id: 'about', label: 'About', url: 'https://yourfavalien.com/about.html', title: 'About YourFavAlien | Official Website', sections: [{ id: 'about-page', label: 'Published page', type: 'Page content', note: 'Existing page is displayed without altering its content.' }] },
    { id: 'contact', label: 'Contact', url: 'https://yourfavalien.com/contact.html', title: 'Contact YourFavAlien | Business & Inquiries', sections: [{ id: 'contact-page', label: 'Published page', type: 'Page content', note: 'Existing contact workflow remains separate from this preview.' }] },
    { id: 'socials', label: 'Socials', url: 'https://yourfavalien.com/socials.html', title: 'YourFavAlien Socials | Official Links', sections: [
      { id: 'socials-hero', label: 'Socials hero photo', type: 'Image', path: 'slots/socials-hero', note: 'Real social hero mapping from the existing configuration.' },
      { id: 'socials-profiles', label: 'Profile photos', type: 'Media group', note: 'TikTok, Instagram, Snapchat, Facebook, and YouTube remain their current mapped slots.' },
      { id: 'socials-links', label: 'Social links', type: 'Links', note: 'Uses the existing socials configuration file when integrated.' }
    ] },
    { id: 'help', label: 'Help', url: 'https://yourfavalien.com/help.html', title: 'Help Center | YourFavAlien', sections: [{ id: 'help-center', label: 'Support Center', type: 'Support content', note: 'Support tools and tickets remain protected administration tools.' }] },
    { id: 'privacy', label: 'Privacy', url: 'https://yourfavalien.com/privacy.html', title: 'Privacy Policy | YourFavAlien', sections: [{ id: 'privacy-page', label: 'Published page', type: 'Policy content', note: 'No SEO or policy metadata changes are included.' }] },
    { id: 'maintenance', label: 'Maintenance', url: 'https://yourfavalien.com/maintenance.html', title: 'YourFavAlien Maintenance', sections: [{ id: 'maintenance-experience', label: 'Maintenance experience', type: 'Dedicated workflow', note: 'Opens separately; it cannot be activated from this preview.' }] }
  ];

  const assetBase = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';
  const assetVersion = '20261016-profile-icons2';
  const media = [
    { id: 'home-hero-media', group: 'Home', label: 'Homepage hero image / video', path: 'slots/home-hero-media', kind: 'video' },
    { id: 'home-orbit-visual', group: 'Home', label: 'Orbit popup photo', path: 'slots/home-orbit-visual', unavailable: 'No custom slot is currently published. The original public fallback is retained; nothing is guessed or replaced.' },
    { id: 'socials-hero', group: 'Socials', label: 'Socials hero photo', path: 'slots/socials-hero' },
    { id: 'socials-tiktok-profile', group: 'Socials', label: 'TikTok profile photo', path: 'slots/socials-tiktok-profile' },
    { id: 'socials-instagram-profile', group: 'Socials', label: 'Instagram profile photo', path: 'slots/socials-instagram-profile' },
    { id: 'socials-snapchat-profile', group: 'Socials', label: 'Snapchat profile photo', path: 'slots/socials-snapchat-profile' },
    { id: 'socials-facebook-profile', group: 'Socials', label: 'Facebook profile photo', path: 'slots/socials-facebook-profile' },
    { id: 'socials-youtube-profile', group: 'Socials', label: 'YouTube profile photo', path: 'slots/socials-youtube-profile', unavailable: 'No custom slot is currently published. The original Socials fallback remains in use.' }
  ];
  const themeGroups = [
    ['Site menu', 'Menu background, lettering, current page, and hover/focus colors.', 'theme/theme.json'],
    ['Main site', 'Existing main site palette and homepage appearance controls.', 'theme/theme.json'],
    ['Orbit Popup', 'Current popup colors and supporting appearance settings.', 'theme/theme.json'],
    ['Socials', 'Page, card, accent, and platform colors for the actual Socials page.', 'theme/theme.json']
  ];

  let currentPage = pages[0];
  let currentSection = currentPage.sections[0];
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function renderPages() {
    $('#page-list').innerHTML = pages.map((page) => `<button class="page-option ${page.id === currentPage.id ? 'active' : ''}" data-page="${page.id}">${esc(page.label)}</button>`).join('');
    document.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => selectPage(button.dataset.page)));
  }
  function renderSections() {
    $('#section-list').innerHTML = currentPage.sections.map((section) => `<button class="section-option ${section.id === currentSection.id ? 'active' : ''}" data-section="${section.id}">${esc(section.label)}<small>${esc(section.type)}</small></button>`).join('');
    document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => selectSection(button.dataset.section)));
  }
  function renderInspector() {
    $('#inspector-heading').textContent = currentSection.label;
    const mediaItem = media.find((item) => item.id === currentSection.id);
    const path = currentSection.path ? `<div class="data-row"><span>EXISTING SLOT PATH</span><b>${esc(currentSection.path)}</b></div>` : '';
    const mediaLibraryAction = mediaItem ? `<button class="library-action" data-jump="media">Manage this asset in Media Library →</button>` : '';
    $('#inspector-content').innerHTML = `<div class="inspector-block"><h3>${esc(currentSection.type)}</h3><p>${esc(currentSection.note)}</p>${path}<div class="data-row"><span>PAGE REFERENCE</span><b>${esc(currentPage.label)}</b></div>${mediaLibraryAction}<div class="locked-action"><strong>Media stays centralized.</strong><br>Replace, crop, position, remove, and restore actions belong in Media Library—not scattered through page settings. Those actions will remain protected by a staged draft and explicit publish review.</div></div>`;
    document.querySelector('#inspector-content [data-jump="media"]')?.addEventListener('click', () => showScreen('media'));
  }
  function selectPage(id) {
    currentPage = pages.find((page) => page.id === id) || pages[0];
    currentSection = currentPage.sections[0];
    $('#page-name').textContent = currentPage.label;
    $('#site-preview').src = currentPage.url;
    $('#open-page').onclick = () => window.open(currentPage.url, '_blank', 'noopener');
    renderPages(); renderSections(); renderInspector();
  }
  function selectSection(id) {
    currentSection = currentPage.sections.find((section) => section.id === id) || currentPage.sections[0];
    renderSections(); renderInspector();
  }
  function assetUrl(item) { return item && !item.unavailable ? `${assetBase}${item.path}?v=${assetVersion}` : ''; }
  function mediaPreview(item) {
    if (item.unavailable) return `<div class="media-unavailable">Original public fallback retained<br><small>no replacement guessed</small></div>`;
    const source = assetUrl(item);
    return item.kind === 'video'
      ? `<video class="media-thumb" muted loop autoplay playsinline preload="metadata" src="${esc(source)}"></video>`
      : `<img class="media-thumb" src="${esc(source)}" alt="Current ${esc(item.label)}" loading="lazy">`;
  }
  function card(title, copy, path, swatch = false, preview = '') {
    return `<article class="resource-card">${preview || (swatch ? '<div class="asset-swatch">Mapped existing configuration</div>' : '')}<p class="eyebrow">${esc(path ? 'CURRENT REFERENCE' : 'PRESERVED AREA')}</p><h2>${esc(title)}</h2><p>${esc(copy)}</p>${path ? `<code>${esc(path)}</code>` : ''}</article>`;
  }
  function buildResources() {
    $('#pages-grid').innerHTML = pages.filter((page) => page.id !== 'maintenance').map((page) => card(page.label, `Published page title: ${page.title}`, page.url)).join('');
    $('#media-grid').innerHTML = media.map((item) => card(item.label, item.unavailable || `${item.group} · actual asset loaded from its current Cloudflare slot.`, item.path, false, mediaPreview(item))).join('');
    $('#design-grid').innerHTML = themeGroups.map(([name, copy, path]) => card(name, copy, path, true)).join('');
    $('#socials-grid').innerHTML = [card('Socials configuration', 'Existing social labels, destinations, visibility, and synchronization remain in the current configuration. Media is managed centrally in Media Library.', 'socials/socials.json')].join('');
    $('#seo-grid').innerHTML = pages.filter((page) => page.id !== 'maintenance').map((page) => card(page.label, page.title, page.url)).join('');
  }
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === id));
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.nav === id));
    $('.sidebar').classList.remove('open');
  }

  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.nav)));
  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.jump)));
  document.querySelectorAll('.viewport').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.viewport').forEach((item) => item.classList.toggle('active', item === button));
    $('#canvas-wrap').className = `canvas-wrap viewport-${button.dataset.viewport}`;
  }));
  $('.mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  renderPages(); renderSections(); renderInspector(); buildResources(); selectPage('home');
})();
