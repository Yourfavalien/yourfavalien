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

  const media = [
    ['home-hero-media', 'Home', 'Homepage hero image / video', 'slots/home-hero-media'],
    ['home-orbit-visual', 'Home', 'Orbit popup photo', 'slots/home-orbit-visual'],
    ['socials-hero', 'Socials', 'Socials hero photo', 'slots/socials-hero'],
    ['socials-tiktok-profile', 'Socials', 'TikTok profile photo', 'slots/socials-tiktok-profile'],
    ['socials-instagram-profile', 'Socials', 'Instagram profile photo', 'slots/socials-instagram-profile'],
    ['socials-snapchat-profile', 'Socials', 'Snapchat profile photo', 'slots/socials-snapchat-profile'],
    ['socials-facebook-profile', 'Socials', 'Facebook profile photo', 'slots/socials-facebook-profile'],
    ['socials-youtube-profile', 'Socials', 'YouTube profile photo', 'slots/socials-youtube-profile']
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
    const path = currentSection.path ? `<div class="data-row"><span>EXISTING SLOT PATH</span><b>${esc(currentSection.path)}</b></div>` : '';
    $('#inspector-content').innerHTML = `<div class="inspector-block"><h3>${esc(currentSection.type)}</h3><p>${esc(currentSection.note)}</p>${path}<div class="data-row"><span>PAGE REFERENCE</span><b>${esc(currentPage.label)}</b></div><div class="locked-action">Editing controls are intentionally locked here. The current APIs publish directly, so a true server-side draft and review flow must exist before these controls can write.</div></div>`;
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
  function card(title, copy, path, swatch = false) {
    return `<article class="resource-card">${swatch ? '<div class="asset-swatch">Mapped existing configuration</div>' : ''}<p class="eyebrow">${esc(path ? 'CURRENT REFERENCE' : 'PRESERVED AREA')}</p><h2>${esc(title)}</h2><p>${esc(copy)}</p>${path ? `<code>${esc(path)}</code>` : ''}</article>`;
  }
  function buildResources() {
    $('#pages-grid').innerHTML = pages.filter((page) => page.id !== 'maintenance').map((page) => card(page.label, `Published page title: ${page.title}`, page.url)).join('');
    $('#media-grid').innerHTML = media.map(([id, group, label, path]) => card(label, `${group} · existing mapped media slot`, path, true)).join('');
    $('#design-grid').innerHTML = themeGroups.map(([name, copy, path]) => card(name, copy, path, true)).join('');
    $('#socials-grid').innerHTML = [card('Socials configuration', 'Existing social labels, destinations, visibility, and synchronization remain in the current configuration.', 'socials/socials.json'), ...media.filter((slot) => slot[1] === 'Socials').map(([, group, label, path]) => card(label, `${group} media mapping; no asset is copied or replaced.`, path, true))].join('');
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
