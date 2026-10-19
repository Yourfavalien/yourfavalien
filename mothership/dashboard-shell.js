(() => {
  'use strict';
  const waitFor = (selector, attempts = 40) => new Promise(resolve => {
    const tick = () => { const node = document.querySelector(selector); if (node || attempts-- <= 0) return resolve(node); setTimeout(tick, 100); };
    tick();
  });
  const click = id => document.getElementById(id)?.click();
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const reveal = (id, tries = 18) => document.getElementById(id) ? scrollTo(id) : tries > 0 && setTimeout(() => reveal(id, tries - 1), 120);
  const hide = (...nodes) => nodes.forEach(node => node?.classList.add('hidden'));

  async function mount() {
    const dashboard = await waitFor('#dashboard');
    if (!dashboard || document.querySelector('.yfa-app-layout')) return;
    document.body.classList.add('yfa-app-ready');

    const layout = document.createElement('div'); layout.className = 'yfa-app-layout';
    const appBar = document.createElement('header'); appBar.className = 'yfa-app-sidebar';
    appBar.innerHTML = `<div class="yfa-app-brand"><span>✦</span><div><b>MOTHERSHIP</b><small>YourFavAlien control center</small></div></div><nav class="yfa-app-nav" aria-label="Mothership navigation"><button data-area="dashboard" aria-current="page">Dashboard</button><button data-area="editor">Website Editor</button><button data-area="pages">Pages & Navigation</button><button data-area="design">Design & Branding</button><button data-area="media">Media Library</button><button data-area="socials">Socials & Links</button><button data-area="popup">Popups & Email</button><button data-area="maintenance">Maintenance</button><button data-area="settings">Settings</button></nav><a class="yfa-app-view-site" href="https://yourfavalien.com" target="_blank" rel="noopener">↗ View site</a>`;
    const main = document.createElement('main'); main.className = 'yfa-app-main';
    dashboard.parentNode.insertBefore(layout, dashboard); layout.append(appBar, main); main.append(dashboard);

    const home = document.createElement('section'); home.id = 'yfaAppHome'; home.className = 'yfa-app-home';
    home.innerHTML = `<article class="yfa-app-welcome"><div class="eyebrow">YOURFAVALIEN · WEBSITE CONTROL</div><h1>Welcome back to Mothership.</h1><p>Manage your real site without losing the tools that already run it.</p><div class="yfa-app-actions"><button data-jump="yfaWebsiteEditor">Open editor</button><button data-jump="websiteImages">Manage media</button><button data-jump="yfaMaintenanceControl">Maintenance</button></div></article><article class="yfa-app-status"><div class="eyebrow">SITE STATUS</div><strong>Protected controls connected</strong><small>Publishing stays explicit. Opening a tool never changes your public website by itself.</small></article>`;
    dashboard.querySelector('.topbar')?.insertAdjacentElement('afterend', home);

    const editor = document.createElement('section'); editor.id = 'yfaWebsiteEditor'; editor.className = 'yfa-website-editor hidden';
    editor.innerHTML = `<header class="yfa-editor-head"><div><div class="eyebrow">WEBSITE EDITOR</div><h2>Work from the real site.</h2><p>Choose a page, preview it at any size, then open the exact existing controls that change it.</p></div><div class="yfa-editor-actions"><button class="active" data-editor-viewport="desktop">Desktop</button><button data-editor-viewport="tablet">Tablet</button><button data-editor-viewport="mobile">Mobile</button><a href="https://yourfavalien.com" target="_blank" rel="noopener">Open live page ↗</a></div></header><div class="yfa-editor-grid"><aside class="yfa-editor-pages"><div class="eyebrow">PAGES</div><button class="active" data-editor-page="/">Home</button><button data-editor-page="/socials.html">Socials</button><button data-editor-page="/about.html">About</button><button data-editor-page="/contact.html">Contact</button></aside><section class="yfa-editor-canvas"><div class="yfa-canvas-label">LIVE WEBSITE PREVIEW</div><div class="yfa-editor-frame" data-viewport="desktop"><iframe id="yfaEditorPreview" title="YourFavAlien website preview" src="/"></iframe></div></section><aside class="yfa-editor-inspector"><div class="eyebrow">SELECTED PAGE</div><h3 id="yfaEditorPageName">Home</h3><p>These buttons open the working Mothership controls for the page in view.</p><button data-editor-control="homeHeroControlsTitle">Hero & button</button><button data-editor-control="menuEditorTitle">Navigation</button><button data-editor-control="websiteImages">Images & video</button><button data-editor-control="themeColors">Colors & design</button><button data-editor-control="socialsView">Social links</button></aside></div></section>`;
    home.insertAdjacentElement('afterend', editor);

    const controlsView = document.getElementById('controlsView');
    const socialsView = document.getElementById('socialsView');
    const maintenanceView = document.getElementById('maintenanceView');
    const showControls = anchor => { editor.classList.add('hidden'); click('controlsTab'); setTimeout(() => reveal(anchor), 0); };
    const showEditor = () => { hide(controlsView, socialsView, maintenanceView); editor.classList.remove('hidden'); editor.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const showMaintenance = () => { editor.classList.add('hidden'); click('maintenanceTab'); setTimeout(() => reveal('yfaMaintenanceControl'), 80); };
    const showSocials = () => { editor.classList.add('hidden'); click('socialsTab'); setTimeout(() => scrollTo('socialsView'), 0); };

    home.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => button.dataset.jump === 'yfaWebsiteEditor' ? showEditor() : button.dataset.jump === 'yfaMaintenanceControl' ? showMaintenance() : showControls(button.dataset.jump)));
    editor.querySelectorAll('[data-editor-page]').forEach(button => button.addEventListener('click', () => {
      editor.querySelectorAll('[data-editor-page]').forEach(item => item.classList.remove('active'));
      button.classList.add('active'); editor.querySelector('#yfaEditorPreview').src = button.dataset.editorPage;
      editor.querySelector('#yfaEditorPageName').textContent = button.textContent;
    }));
    editor.querySelectorAll('[data-editor-viewport]').forEach(button => button.addEventListener('click', () => {
      editor.querySelectorAll('[data-editor-viewport]').forEach(item => item.classList.remove('active'));
      button.classList.add('active'); editor.querySelector('.yfa-editor-frame').dataset.viewport = button.dataset.editorViewport;
    }));
    editor.querySelectorAll('[data-editor-control]').forEach(button => button.addEventListener('click', () => button.dataset.editorControl === 'socialsView' ? showSocials() : showControls(button.dataset.editorControl)));

    const actions = {
      dashboard: () => { editor.classList.add('hidden'); home.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, editor: showEditor,
      pages: () => showControls('menuEditorTitle'), design: () => showControls('themeColors'), media: () => showControls('websiteImages'), socials: showSocials,
      popup: () => { showControls('yfaPopupControl'); setTimeout(() => reveal('yfaPopupControl'), 80); }, maintenance: showMaintenance,
      settings: () => { showControls('yfaBadgeControl'); setTimeout(() => reveal('yfaBadgeControl'), 80); }
    };
    appBar.querySelectorAll('[data-area]').forEach(button => button.addEventListener('click', () => { appBar.querySelectorAll('[data-area]').forEach(item => item.removeAttribute('aria-current')); button.setAttribute('aria-current', 'page'); actions[button.dataset.area]?.(); }));

    const utilities = document.createElement('section'); utilities.id = 'yfaAppUtilities'; utilities.className = 'yfa-app-utilities'; home.insertAdjacentElement('afterend', utilities);
    const placeUtilities = () => ['yfaPopupControl', 'yfaBadgeControl'].forEach(id => { const panel = document.getElementById(id); if (panel && panel.parentElement !== utilities) utilities.append(panel); });
    placeUtilities(); setTimeout(placeUtilities, 400); setTimeout(placeUtilities, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
